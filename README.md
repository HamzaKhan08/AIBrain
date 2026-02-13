# 🧠 Exam & Interview Question Prediction AI

An AI-powered platform that analyzes previous-year question papers and interview questions to predict high-probability expected questions for the current year using NLP, embeddings, trend analysis, and Large Language Models.

The system supports academic exams, technical interviews, coding rounds, and domain-specific papers (engineering, medical, software, etc.).

---

# 🚀 Problem Statement

Students and job aspirants often prepare using past papers, but manually identifying trends across years is difficult and time-consuming.

There was no intelligent system that could:

- Understand past papers
- Detect topic trends
- Identify frequently asked concepts
- Predict likely upcoming questions
- Explain reasoning behind predictions

This project solves that problem using AI.

---

# 💡 Solution Overview

This platform allows users to upload multiple previous-year papers (PDF/DOC/DOCX).

The AI system then:

1. Extracts questions from documents
2. Classifies topics and difficulty
3. Analyzes trends across years
4. Applies temporal weighting
5. Detects repeated patterns
6. Predicts expected questions
7. Generates detailed answers
8. Explains why each question is predicted

---

# 🧠 How the AI Works (Simple Explanation)

The AI reads past papers similar to how a teacher analyzes exam patterns.

It looks for:

- Topics asked frequently
- Topics not asked recently
- Difficulty progression
- Question style patterns
- Rephrased or repeated questions

Then it predicts:

👉 “These questions have high chance this year”

Each prediction includes:

- Confidence score
- Reason
- Supporting evidence
- Detailed answer

---

# ⚙️ AI Pipeline (Step-by-Step)

## Step 1 — Document Upload
Users upload previous papers in:

- PDF
- DOC
- DOCX

---

## Step 2 — Text Extraction
Documents are converted into structured text using parsers.

Output example:

