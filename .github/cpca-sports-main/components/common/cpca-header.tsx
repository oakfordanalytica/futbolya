import Image from "next/image";
import { AspectRatio } from "../ui/aspect-ratio";

interface CpcaHeaderProps {
  title: string;
  subtitle: string;
  logoUrl?: string;
}

const CpcaHeader = ({ title, subtitle, logoUrl }: CpcaHeaderProps) => {
  return (
    <header className="flex items-center gap-4 mb-4">
      <div className="w-15 h-15 shrink-0 rounded-lg overflow-hidden bg-muted/30 relative">
        <Image
          src={logoUrl || "/cpca-logo.png"}
          alt="Organization Logo"
          fill
          className="object-fit"
        />
      </div>
      <div className="border-l-2 border-muted-foreground pl-4">
        <h4 className="font-semibold text-lg">{title}</h4>
        <p className="text-sm">{subtitle}</p>
      </div>
    </header>
  );
};
export default CpcaHeader;
