/*
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██╗  ██╗███████╗
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗██║ ██╔╝╚══███╔╝
 * ██╔██╗ ██║██║   ██║██║   ██║███████║█████╔╝   ███╔╝
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║██╔═██╗  ███╔╝
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║██║  ██╗███████╗
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
 * Projeto KAMIKAZE 神風 — criado por NOVAK.
 */
export default function Logo({ size = 34 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="47" stroke="#5b9cff" strokeWidth="2" />
      <path
        d="M50 8 C 30 24, 30 40, 50 50 C 70 60, 70 76, 50 92"
        stroke="#5b9cff"
        strokeWidth="2"
        fill="none"
        opacity="0.55"
      />
      <text
        x="50"
        y="64"
        textAnchor="middle"
        fontFamily="'Zen Kaku Gothic New', sans-serif"
        fontWeight="900"
        fontSize="46"
        fill="#eaf1ff"
      >
        風
      </text>
    </svg>
  );
}
