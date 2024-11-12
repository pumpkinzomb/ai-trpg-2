import { HfInference } from "@huggingface/inference";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);

const BASE_STYLE_PROMPT = `
  fantasy art style, high quality digital art, detailed illustration,
  vibrant colors with rich textures, soft magical lighting,
  inspired by classical fairy tale illustrations and modern fantasy games,
  elegant composition with dramatic atmosphere,
  painted in the style of Charlie Bowater and Jesper Ejsing,
  featuring intricate details and whimsical elements,
  professional concept art quality, cinematic wide shot,
  atmospheric lighting with subtle color gradients,
  balanced composition with focus on storytelling,
  perfect for fantasy RPG character illustrations
`
  .replace(/\s+/g, " ")
  .trim();

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function generateImage(prompt: string): Promise<string | null> {
  try {
    const enhancedPrompt = `
      Depict ${prompt},
      Style: ${BASE_STYLE_PROMPT}
    `.trim();

    const response = await hf.textToImage({
      inputs: enhancedPrompt,
      model: "black-forest-labs/FLUX.1-schnell",
    });

    // 이미지 버퍼 생성
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // 저장 경로 설정
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "generated-image"
    );
    await ensureDirectoryExists(uploadDir);

    // 유니크한 파일명 생성
    const fileName = `${uuidv4()}.png`;
    const filePath = path.join(uploadDir, fileName);

    // 파일 저장
    await fs.writeFile(filePath, imageBuffer);

    // public 폴더 기준 상대 URL 반환
    return `/uploads/generated-image/${fileName}`;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}

export async function saveGeneratedImage(
  generatedImagePath: string,
  destinationDir: string,
  filename: string
): Promise<string> {
  const publicDir = path.join(process.cwd(), "public");
  const uploadsDir = path.join(publicDir, "uploads");
  const generatedImageDir = path.join(uploadsDir, "generated-image");

  // 대상 디렉토리 전체 경로
  const fullDestinationDir = path.join(generatedImageDir, destinationDir);

  // 필요한 디렉토리 생성
  try {
    await fs.access(fullDestinationDir);
  } catch {
    await fs.mkdir(fullDestinationDir, { recursive: true });
    console.log(`Created directory: ${fullDestinationDir}`);
  }

  // 원본 경로와 대상 경로 설정 (generatedImagePath에서 파일명 추출)
  const sourcePath = path.join(publicDir, generatedImagePath);
  const destinationPath = path.join(fullDestinationDir, `${filename}.png`);

  // 이미지 파일 이동
  await fs.rename(sourcePath, destinationPath);
  console.log(`Saved image to: ${destinationPath}`);

  // URL 경로 반환
  return `/uploads/generated-image/${destinationDir}/${filename}.png`;
}
