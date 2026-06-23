import { Link } from "react-router";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  linkText?: string;
  href?: string;
};

function SectionTitle({ title, subtitle, linkText, href }: SectionTitleProps) {
  return (
    <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="font-serif text-3xl font-bold text-[#1f2538]">
          {title}
        </h2>
        <div className="mt-2 h-0.5 w-24 bg-[#f4b855]" />
        {subtitle && <p className="mt-5 text-sm text-gray-600">{subtitle}</p>}
      </div>

      {linkText && href && (
        <Link to={href} className="text-sm font-medium underline hover:text-[#173f2a]">
          {linkText}
        </Link>
      )}
    </div>
  );
}

export default SectionTitle;
