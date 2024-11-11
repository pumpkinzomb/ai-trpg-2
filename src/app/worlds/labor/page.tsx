import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { generateImage } from "@/app/utils/aiDrawing";
import { LaborClient } from "./components/labor-client";
import fs from "fs/promises";
import path from "path";

const MAX_LABOR_IMAGES = 10;

const backgroundStyles = [
  "dark and gloomy underground mine shaft with flickering torches",
  "bustling medieval quarry with stone cutting activities",
  "vast wheat fields under the scorching sun",
  "busy lumber mill with massive logs being processed",
  "smoky blacksmith forge with molten metal",
  "crowded fishing dock with workers hauling nets",
  "dusty construction site of a massive castle",
  "chaotic shipyard with workers building vessels",
  "steamy industrial kitchen with multiple cookfires",
  "merchant caravan loading heavy cargo",
];

const workerStyles = [
  "exhausted miners swinging pickaxes",
  "muscular laborers carrying heavy stones",
  "sweating farmers with scythes and tools",
  "determined woodcutters with axes",
  "focused blacksmiths hammering metal",
  "weathered fishermen pulling nets",
  "tired builders lifting materials",
  "busy shipwrights working on hulls",
  "overworked servants rushing about",
  "strained porters moving crates",
];

const atmosphereStyles = [
  "harsh and demanding environment",
  "physically challenging conditions",
  "relentless and grueling atmosphere",
  "tough and unforgiving workplace",
  "intense and laborious setting",
];

const lightingStyles = [
  "dim torch light casting long shadows",
  "harsh midday sun beating down",
  "orange glow from furnaces and forges",
  "early morning fog with filtered light",
  "smoky atmosphere with scattered light",
];

function getRandomElement(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function getOrGenerateLaborImage(imageSlot?: number): Promise<string> {
  const publicDir = path.join(process.cwd(), "public");
  const uploadsDir = path.join(publicDir, "uploads");
  const generatedImageDir = path.join(uploadsDir, "generated-image");
  const laborDir = path.join(generatedImageDir, "labor");

  for (const dir of [uploadsDir, generatedImageDir, laborDir]) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }

  const randomSlot = imageSlot || Math.floor(Math.random() * MAX_LABOR_IMAGES);
  const imagePath = path.join(laborDir, `image${randomSlot}.png`);
  const imageUrlPath = `/uploads/generated-image/labor/image${randomSlot}.png`;

  try {
    await fs.access(imagePath);
    console.log(`Using existing image at slot ${randomSlot}`);
    return imageUrlPath;
  } catch {
    console.log(`Generating new image for slot ${randomSlot}`);

    const laborImagePrompt = `
      Wide angle view of a ${getRandomElement(backgroundStyles)},
      showing ${getRandomElement(workerStyles)},
      in a ${getRandomElement(atmosphereStyles)},
      illuminated by ${getRandomElement(lightingStyles)},
      medieval fantasy style, highly detailed, dramatic lighting, cinematic composition
    `.trim();

    console.log(`Using prompt: ${laborImagePrompt}`);

    const generatedImagePath = await generateImage(laborImagePrompt);

    if (!generatedImagePath) {
      throw new Error(`Failed to generate labor image for slot ${randomSlot}`);
    }

    const sourceImagePath = path.join(publicDir, generatedImagePath);
    await fs.rename(sourceImagePath, imagePath);
    console.log(`Saved new image to slot ${randomSlot}`);

    return imageUrlPath;
  }
}

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function LaborPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const imageSlot = searchParams.slot
    ? parseInt(searchParams.slot as string)
    : Math.floor(Math.random() * MAX_LABOR_IMAGES);

  if (!searchParams.slot) {
    redirect(`/worlds/labor?slot=${imageSlot}`);
  }

  const laborImage = await getOrGenerateLaborImage(imageSlot);

  return <LaborClient laborImage={laborImage} />;
}
