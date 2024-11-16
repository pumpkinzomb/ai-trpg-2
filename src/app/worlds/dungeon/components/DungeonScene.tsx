import React from "react";

const DungeonScene = ({
  description,
  image,
}: {
  description: string;
  image?: string;
}) => {
  if (!image) {
    return (
      <div className="p-4">
        <p className="text-lg">{description}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square">
      <img
        src={image}
        alt="상황 이미지"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
        <div className="absolute top-0 left-0 right-0 p-6">
          <p className="text-lg text-white drop-shadow-md">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default DungeonScene;
