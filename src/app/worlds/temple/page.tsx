import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { generateImage } from "@/app/utils/aiDrawing";
import { TempleClient } from "./components/temple-client";
import fs from "fs/promises";
import path from "path";

const MAX_TEMPLE_IMAGES = 10;

const templeStyles = [
  "grand gothic cathedral with towering spires and flying buttresses",
  "ancient eastern temple with curved roofs and paper lanterns",
  "mystical elven sanctuary with living trees as pillars",
  "celestial crystal temple with floating crystalline platforms",
  "nature-infused woodland shrine with flowering vines and waterfalls",
];

const mainFigureStyles = [
  "wise elder high priest performing a blessing ritual",
  "young priestess leading a prayer ceremony",
  "mysterious oracle sharing visions with followers",
  "nature-attuned druid teaching apprentices",
  "radiant paladin protecting pilgrims",
];

const peopleScenes = [
  "devoted followers kneeling in prayer",
  "pilgrims receiving blessings and healing",
  "monks in meditation circles",
  "families bringing offerings and seeking guidance",
  "adventurers seeking divine favor",
  "apprentice priests studying ancient texts",
  "travelers finding shelter and peace",
];

const lightingStyles = [
  "warm golden sunbeams through elaborate stained glass windows",
  "ethereal blue moonlight filtering through crystal domes",
  "magical floating orbs of rainbow light",
  "soft candlelight from hundreds of floating candles",
  "divine rays piercing through magical mist",
];

const magicalElements = [
  "swirling healing auras and magical symbols",
  "floating magical scrolls and glowing runes",
  "shimmering protective barriers",
  "ethereal spirit guardians",
  "blooming magical flowers and herbs",
  "levitating ritual objects and holy relics",
];

const atmosphereStyles = [
  "peaceful and serene with incense smoke",
  "mysterious and magical with floating sparkles",
  "holy and divine with sacred geometries",
  "ancient and powerful with echoing chants",
  "natural and harmonious with gentle breeze",
];

function getRandomElement(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function getOrGenerateTempleImage(imageSlot?: number): Promise<string> {
  const publicDir = path.join(process.cwd(), "public");
  const uploadsDir = path.join(publicDir, "uploads");
  const generatedImageDir = path.join(uploadsDir, "generated-image");
  const templeDir = path.join(generatedImageDir, "temple");

  for (const dir of [uploadsDir, generatedImageDir, templeDir]) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }

  const randomSlot = imageSlot || Math.floor(Math.random() * MAX_TEMPLE_IMAGES);
  const imagePath = path.join(templeDir, `image${randomSlot}.png`);
  const imageUrlPath = `/uploads/generated-image/temple/image${randomSlot}.png`;

  try {
    await fs.access(imagePath);
    console.log(`Using existing image at slot ${randomSlot}`);
    return imageUrlPath;
  } catch {
    console.log(`Generating new image for slot ${randomSlot}`);

    const templeImagePrompt = `
      Wide angle view of a ${getRandomElement(templeStyles)},
      where ${getRandomElement(mainFigureStyles)},
      surrounded by ${getRandomElement(peopleScenes)} and ${getRandomElement(
      peopleScenes
    )},
      illuminated by ${getRandomElement(lightingStyles)},
      with ${getRandomElement(magicalElements)},
      creating a ${getRandomElement(atmosphereStyles)} atmosphere,
      epic fantasy art style, highly detailed interior architecture, cinematic composition
    `.trim();

    console.log(`Using prompt: ${templeImagePrompt}`);

    const generatedImagePath = await generateImage(templeImagePrompt);

    if (!generatedImagePath) {
      throw new Error(`Failed to generate temple image for slot ${randomSlot}`);
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

export default async function TemplePage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const imageSlot = searchParams.slot
    ? parseInt(searchParams.slot as string)
    : Math.floor(Math.random() * MAX_TEMPLE_IMAGES);

  if (!searchParams.slot) {
    redirect(`/worlds/temple?slot=${imageSlot}`);
  }

  const templeImage = await getOrGenerateTempleImage(imageSlot);

  return <TempleClient templeImage={templeImage} />;
}
