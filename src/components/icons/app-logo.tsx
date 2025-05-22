
import type { SVGProps } from 'react';

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      {...props}
    >
      <path d="M10 21.5c.87.28 1.76.44 2.68.52.51.04 1.02.08 1.54.08 3.68 0 7.01-1.48 9.42-3.95a13.47 13.47 0 0 0-1.27-2.06" />
      <path d="M10 21.5c-.53-.2-.99-.44-1.4-.72-.7-.48-1.29-1.08-1.77-1.77-.83-1.2-1.27-2.65-1.27-4.14S6 11.4 6.76 9.92c.28-.53.6-.98.97-1.37" />
      <path d="M5.56 17.8c-2.4-2.86-2.95-6.81-1.48-10.24A13.49 13.49 0 0 1 11.5 2c.54 0 1.07.04 1.6.11" />
      <path d="m10.5 13.5 7-7" />
      <path d="M15.5 2l-3 3.5" />
      <path d="M22 8.5l-3.5 3" />
      <path d="M10 21.5.38 11.88A13.493 13.493 0 0 1 11.5 2c.36 0 .72.02 1.08.05" />
    </svg>
  );
}
