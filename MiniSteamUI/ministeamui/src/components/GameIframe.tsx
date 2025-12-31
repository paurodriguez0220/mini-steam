import bgImage from "../assets/nintendobackground.png";

type Props = {
  src: string;
};

export function GameIframe({ src }: Props) {
  return (
    <div
      className="relative w-full aspect-[4/3] bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <iframe
        src={src}
        className="absolute inset-0 w-full h-full border-0"
        allow="fullscreen; gamepad; autoplay"
        loading="lazy"
      />
    </div>
  );
}
