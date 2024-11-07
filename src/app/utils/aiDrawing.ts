import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_TOKEN);

console.log(
  "process.env.HUGGINGFACE_API_TOKEN",
  process.env.HUGGINGFACE_API_TOKEN
);

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
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const base64Image = imageBuffer.toString("base64");
    const contentType = "image/png";
    return `data:${contentType};base64,${base64Image}`;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}
