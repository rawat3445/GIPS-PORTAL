function getInitials(name) {
  return String(name || "S")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function ProfileAvatar({
  src = "",
  name = "",
  sizeClass = "h-10 w-10",
  className = "",
  textClassName = "text-sm",
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={`${name || "Student"} profile`}
        className={`${sizeClass} rounded-full border border-white/70 object-cover shadow-sm ${className}`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} inline-flex items-center justify-center rounded-full border border-white/70 bg-gradient-to-br from-blue-100 via-cyan-50 to-indigo-100 font-semibold text-blue-700 shadow-sm ${textClassName} ${className}`}
    >
      {getInitials(name)}
    </span>
  );
}
