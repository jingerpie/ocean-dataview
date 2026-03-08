import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { chromium } from "playwright";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

console.log("Starting Playwright recording script...");

try {
  const browser = await chromium.launch({ headless: true });
  console.log("Browser launched");

  const context = await browser.newContext({
    recordVideo: {
      dir: "./showcase/raw-videos/",
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
    colorScheme: "dark",
  });

  const page = await context.newPage();

  const loadViewAndWait = async (name, url) => {
    console.log(`Navigating to ${name}`);
    await page.goto(url);
    await page.waitForTimeout(2000); // Wait for initial render
    console.log(`Done on ${name}`);
  };

  await loadViewAndWait("Table", "http://localhost:3001/table");
  await loadViewAndWait("List", "http://localhost:3001/list");
  await loadViewAndWait("Gallery", "http://localhost:3001/gallery");
  await loadViewAndWait("Board", "http://localhost:3001/board");

  await context.close();
  await browser.close();

  const videoPath = await page.video().path();
  const finalVideoPath = "./showcase/showcase.webm";
  const finalGifPath = "./showcase/showcase.gif";

  // Move the webm file to the final destination
  const fs = await import("node:fs");
  fs.renameSync(videoPath, finalVideoPath);

  console.log("Video recorded successfully in ./showcase/showcase.webm");
  console.log("Starting GIF conversion (this may take a minute)...");

  ffmpeg(finalVideoPath)
    .outputOptions([
      "-vf",
      "fps=10,scale=1280:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
      "-loop",
      "0", // Infinite loop
    ])
    .toFormat("gif")
    .on("end", () => {
      console.log("GIF conversion complete! Saved to ./showcase/showcase.gif");
      // Clean up raw directory
      fs.rmSync("./showcase/raw-videos/", { recursive: true, force: true });
      process.exit(0);
    })
    .on("error", (err) => {
      console.error("Error generating GIF:", err);
      process.exit(1);
    })
    .save(finalGifPath);
} catch (error) {
  console.error("Error during recording:", error);
  process.exit(1);
}
