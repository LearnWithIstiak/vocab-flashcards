import { useEffect } from "react";

export default function Ad({ code, id }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = code;
    script.async = true;

    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = ""; // clear old ad
      container.appendChild(script);
    }
  }, [code, id]);

  return <div id={id} className="my-6 text-center"></div>;
}
