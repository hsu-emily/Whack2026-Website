/**
 * Cloud — renders one of the hand-painted cloud PNGs in /public/clouds.
 *
 *   src         {string}         file name inside public/clouds (e.g. "cloud-1.png")
 *   width       {number|string}  CSS width (default 320). Height follows the PNG's aspect ratio.
 *   opacity     {number}         0-1 (default 1)
 *   flip        {boolean}        mirror horizontally so one PNG can serve both sides
 *   drift       {boolean}        slow floating bob
 *   driftSpeed  {number}         seconds per bob cycle (default 9)
 *   className, style             passed through to the <img>
 */
export default function Cloud({
  src,
  width = 320,
  opacity = 1,
  flip = false,
  drift = false,
  driftSpeed = 9,
  className = "",
  style = {},
}) {
  const w = typeof width === "number" ? `${width}px` : width;
  return (
    <img
      src={`${import.meta.env.BASE_URL}clouds/${src}`}
      alt=""
      draggable={false}
      className={`cloud-img${drift ? " cloud-img-drift" : ""}${flip ? " cloud-img-flip" : ""} ${className}`.trim()}
      style={{ width: w, opacity, "--drift-speed": `${driftSpeed}s`, ...style }}
    />
  );
}
