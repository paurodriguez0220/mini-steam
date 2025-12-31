type Props = {
  title: string;
  rightActions?: React.ReactNode;
};

export function GameHeader({ title, rightActions }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#E60012] border-b border-[#d63347] rounded-t-lg">
      <h1 className="text-base font-bold tracking-wide text-white">{title}</h1>
      <div className="flex items-center gap-2">{rightActions}</div>
    </div>
  );
}
