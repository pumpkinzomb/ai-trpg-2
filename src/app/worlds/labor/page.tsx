import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { generateImage, saveGeneratedImage } from "@/app/utils/aiDrawing";
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
  const randomSlot = imageSlot || Math.floor(Math.random() * MAX_LABOR_IMAGES);
  const expectedPath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "generated-image",
    "labor",
    `image${randomSlot}.png`
  );

  try {
    await fs.access(expectedPath);
    console.log(`Using existing image at slot ${randomSlot}`);
    return `/uploads/generated-image/labor/image${randomSlot}.png`;
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

    return await saveGeneratedImage(
      generatedImagePath,
      "labor",
      `image${randomSlot}`
    );
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
