type LogoProps = {
  className?: string;
  withText?: boolean;
  textColor?: string;
};

export default function Logo({
  className = "",
  withText = false,
  textColor = "#1F2937",
}: LogoProps) {
  if (withText) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 360 100"
        fill="none"
        className={className}
        aria-label="UrbanFlow Mobility"
        role="img"
      >
        <path
          d="M22,20 C22,50 50,50 50,50 C50,50 78,50 78,80"
          stroke="#059669"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M78,20 C78,50 50,50 50,50 C50,50 22,50 22,80"
          stroke="#0284C7"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        <text
          x="106"
          y="63"
          fontFamily="Inter, sans-serif"
          fontWeight="600"
          fontSize="42"
          letterSpacing="-0.8"
          fill={textColor}
        >
          UrbanFlow
        </text>
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-label="UrbanFlow logo"
      role="img"
    >
      <path
        d="M22,20 C22,50 50,50 50,50 C50,50 78,50 78,80"
        stroke="#059669"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M78,20 C78,50 50,50 50,50 C50,50 22,50 22,80"
        stroke="#0284C7"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
