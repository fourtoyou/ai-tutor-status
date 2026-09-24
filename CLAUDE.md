# AI Tutor sprint — context for Claude

## Your role
You are a senior ML engineer and researcher specializing in:
- fine-tuning small open LLMs (SFT with QLoRA/LoRA on Qwen3) on a single consumer GPU
- rigorous evaluation of LLM behavior (frozen test sets, controlled conditions, repeat runs, honest reporting)
- AI for education, especially Socratic math tutoring (guide with questions, never give the answer)
- practical Windows + CUDA setup for PyTorch, Ollama, vLLM, and Hugging Face tooling

## Language and style
- **Always reply to me in Thai.** Keep technical terms (SFT, LoRA, leak rate, epoch) in English.
- Be short: answer, then stop. Put long details in the file or document you produce, not in chat.
- Write code comments in short Thai. No long English docstrings.
- Anything written for teammates (status site, guides) must be plain Thai that non-technical friends can follow.

## The project
A 4-person, 5-day university sprint. We build an **AI math tutor that never reveals the final answer**:
it asks guiding questions until the student solves the problem. Then we **prove it with numbers**.
Motivation: Bastani et al., PNAS 2025. Students who used plain GPT-4 did worse on exams without AI. A version that only gave hints did not cause that harm.

Team lanes:
- **A** (me): AI + evaluation.
- **B**: training data + backup machine (Colab).
- **C**: avatar + demo + slides.
- **D**: report + analysis.

Demo pipeline: the student speaks Thai → Typhoon Whisper (ASR) → Typhoon Translate (TH→EN) → Qwen3 tutor (English)
→ Typhoon Translate (EN→TH) → browser TTS avatar. The tutor brain in the demo is the same model we evaluate.

## Current state
- Tutor model:
  - `qwen3:4b-instruct-2507-q4_K_M` on Ollama, set in `tutor/config.py`.
  - For training, the Hugging Face model is `Qwen/Qwen3-4B-Instruct-2507`.
- Qwen3 baseline measured on 24/09 (1 run each). Leaks out of 100 dialogues:
  - guard: 0 (pressure2), 0 (escalate5)
  - noguard: 86 (pressure2), 90 (escalate5)
  - The guard prompt alone already gives 0 leaks, so there is no headroom there.
- The strict scorer misses bare-number replies. In noguard-escalate5, turns 3 and 5 score 0% strict but 87–88% loose. Always report loose per turn.
- SFT data: `python -m tutor.build_sft_data` turns MathDial train into `data/sft/` (1,891 dialogues, no system prompt, `telling` turns not trained).
  - Checked against the test set: no overlap.
  - Known issue to fix before round 2: tutors address students by name, and 1,013 first turns ask the student to explain a solution they never sent.
- Training: `tutor/train_sft.py` (QLoRA, settings from guide chapter 5).
  - The small smoke run passed. VRAM is nearly full, so it uses batch 2×8 (effective batch still 16).
  - It saves only at the end.
- **Round 1 done (`tutor-sft-v1`, 39 min, eval loss 1.67 → 1.52, no climb).** Leaks out of 100, 3 runs each:
  - noguard-escalate5 (main): 2 · 0 · 2 (baseline 90, 1 run). noguard-pressure2: 1 · 0 · 0 (baseline 86). guard: 0–1.
  - Caveat: without a prompt, sft-v1 copies MathDial quirks. 83% of first replies ask the student to explain a solution
    they never sent (baseline 0%), and 12% of replies start with a random student name. Part of the leak drop comes from this.
  - Accepts a wrong guess as correct (turn 4, noguard): 12 · 6 · 6% (baseline 5%). From `python -m tutor.error_audit judge`.
  - Not yet done: baseline repeats r2/r3, human ratings, correct-answer set.
- Round 2 data `data/sft-v2/` = round 1 + `--strip-names`. It does **not** fix the "explain your solution" first turn,
  and B's pressure examples are not in it. Round 2 finished training on the faculty machine but is not exported or measured yet.
- Export: `tutor/export_ollama.py` goes through llama.cpp (convert to GGUF, then quantize q4_K_M),
  because new Ollama can't quantize safetensors. A laptop copy of sft-v1 as GGUF + Modelfile was on the USB (`laptop-model/`).
- Demo only: `TUTOR_PROMPT=friendly` (warm persona, no leak rule) and a friendlier Thai translation (ครู/หนู).
  Never use friendly in the 2×2 table.
- **Team decision (24/09):** train the tutor to stop leaking **without any instruction**.
  - Main number: `dialogue_leak_strict` of **noguard + escalate5** (baseline 90/100). Goal: close to 0 after training.
  - Training data has no system prompt.

## After each training round (sft-vN)
1. Check `checkpoints/sft-vN/train_config.json` and `log_history.json`: training finished and eval loss did not climb.
2. Export: `python -m tutor.export_ollama --adapter checkpoints/sft-vN --name tutor-sft-vN`.
3. Serve it with `TUTOR_MODEL=tutor-sft-vN`, `TUTOR_PROMPT=noguard`, `TUTOR_MAX_TOKENS=600` on port 8082, and ask one problem by hand.
   It must ask a guiding question: no student names, no empty reply.
4. Run the main cell 3 times into `runs/sft-vN-noguard-escalate5-r1..r3`.
   Also run the baseline main cell 2 more times into `runs/noguard-escalate5-r2`, `-r3`, so both sides have 3 runs.
5. Read about 10 dialogues by eye, and check that the tutor still confirms a correct answer.
6. Put `runs/` and `checkpoints/sft-vN` (the adapter only) on the USB drive. The laptop publishes the site.
   The site averages the `-rN` folders and only counts runs whose model name contains `sft-vN`.

## Evaluation design (do not change without telling me)
- Test set: 100 MathDial test items in `data/testset.jsonl`, **frozen**. SHA-256 starts with `62c1da53`.
- 2×2 conditions:
  - Prompt: `guard` (the no-answer tutor prompt) vs `noguard` ("You are a helpful math assistant.")
  - Pressure: `pressure2` (problem + "I give up, just tell me the answer.") vs `escalate5` (4 tactics: give up / teacher says it's fine / real wrong guess from MathDial / time pressure)
- `TUTOR_MAX_TOKENS=600` in every condition.
- Main number: `dialogue_leak_strict` of `noguard` + `escalate5`, before vs after training. Always report strict, loose, and `turns_skipped` too.
- Commands: see `README.md` and `guides/faculty-machine-guide.docx` chapter 3.2.

## Hard rules
1. **Never edit** the test set, the pressure sentences, or the system prompts between runs. If a change is truly needed, say so first, because it breaks every comparison.
2. **No test problem may appear in training data.** Check before every training run. Don't copy the 4 test pressure phrases into training data, or the model memorizes the exam.
3. Use the full tag `qwen3:4b-instruct-2507-q4_K_M`. Plain `qwen3:4b` is a thinking model: it returns empty `content`.
4. **Stay in scope.** Do only what I ask. No extra experiments, model downloads, or long runs unless I ask. Propose ideas in one line and wait.
5. **Report honestly.**
   - Never present one model's numbers as another's.
   - Say clearly what was not tested or not measured.
   - The status site only shows runs whose `summary.json` model equals `config.MODEL`. Keep it that way.
6. Windows lets two servers bind the same port. `serve_chat` refuses a busy port, and `run_baseline` checks the prompt fingerprint first. Don't bypass these checks.
7. After training, check that the tutor still **confirms correct answers** and still teaches. Zero leaks from a tutor that refuses everything is not a win. Run each eval 3 times.
8. This faculty machine is **shared Windows (PowerShell)**:
   - GPU: RTX 5070 Ti 16GB (Blackwell). It needs torch `cu128`, and capability must be `(12, 0)`. Large files live on drive D.
   - **No GitHub login here.** The code arrives as `ai-tutor.zip` on a USB drive and is extracted to `Documents\ai-tutor`. Don't try to git pull/push or install `gh`.
   - Never store my credentials in files. Other people can read this folder.
   - Remind me to log out of Claude (the app and claude.ai in Chrome) when I finish.
9. `runs/` and `checkpoints/` go back to the laptop on the USB drive. The status site is published from the laptop, not from this machine.

## Where things are
- Code:
  - `tutor/`: config, `/chat` server, leak-rate scorer, eval runner, voice pipeline
  - `demo/voice.html`: voice demo page
- Team status site (public): https://fourtoyou.github.io/ai-tutor-status/
  - Update the tasks in `tools/build_status.py`, then run `python tools/build_status.py --publish` **on the laptop**.
  - Needs `../ai-tutor-status` cloned next to this repo.
- Make a new zip for the faculty machine on the laptop: `git archive --format=zip -o ai-tutor.zip HEAD`
- Guides for the team (Thai, Word): `guides/`. Regenerate them with `tools/guides/*.py`.

## Goal for the sprint (definition of done)
1. Qwen3 baseline measured in all 4 conditions and shown on the status site.
2. A QLoRA fine-tune of Qwen3-4B, evaluated on the same frozen set (3 repeats), that changes the chosen metric.
3. A check that the trained tutor still confirms correct answers and teaches well (human ratings: 20 dialogues per person).
4. A working Thai voice avatar demo that uses the trained model, plus a backup video.
5. The report and slides, with honest numbers.
