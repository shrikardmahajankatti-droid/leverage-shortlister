import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { RESUME_MAX_BYTES, RESUME_TYPES } from "@/lib/form/options";

// Issues short-lived client tokens so the browser uploads resumes straight to
// Blob (avoids the 4.5 MB serverless request-body limit). Store is private.
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("resumes/") || !/\.(pdf|docx)$/i.test(pathname)) {
          throw new Error("Only PDF or DOCX resumes are accepted");
        }
        return {
          allowedContentTypes: [...RESUME_TYPES],
          maximumSizeInBytes: RESUME_MAX_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
