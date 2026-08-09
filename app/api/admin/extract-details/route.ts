import { NextRequest, NextResponse } from "next/server";

const BOOK_PROMPT = "This is a photo of a book cover. Identify: title, author, genre (one or two words, e.g. Fiction, History), publish_date (use your own knowledge of this book to state its original publication year, even if not printed on the cover - only leave blank if you genuinely cannot identify the book), description (a brief 2-3 sentence overview of what this book is about, using your own knowledge of the title and author - do not just describe the cover art, and do not leave this blank unless the book is entirely unidentifiable), condition (leave blank unless visibly damaged).";

export async function POST(req: NextRequest) {
  const password = req.headers.get("x-admin-password");
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const image = body.image;
  const mediaType = body.mediaType;
  const fieldKeys = body.fieldKeys;

  const prompt = BOOK_PROMPT + "\nRespond with ONLY a raw JSON object (no markdown fences, no preamble) with exactly these keys: " + JSON.stringify(fieldKeys) + ". If a field can't be determined, use an empty string for it.";

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: mediaType, data: image } },
                { text: prompt },
              ],
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", res.status, errText);
      return NextResponse.json({ error: errText }, { status: 500 });
    }

    const data = await res.json();
    const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] ? data.candidates[0].content.parts[0].text : "{}";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Extract-details exception:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
