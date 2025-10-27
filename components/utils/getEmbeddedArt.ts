// import { parseBlob } from "music-metadata-browser";
// import { Buffer } from "buffer";

// export async function getEmbeddedArt(uri: string): Promise<string | null> {
//     try {
//         const response = await fetch(uri);
//         const blob = await response.blob();
//         const metadata = await parseBlob(blob);
//         const picture = metadata.common.picture?.[0];

//         if (picture) {
//             const base64 = Buffer.from(picture.data).toString("base64");
//             return `data:${picture.format};base64,${base64}`;
//         }

//         return null;
//     } catch (error) {
//         console.log("⚠️ خطأ أثناء استخراج صورة الغلاف:", error);
//         return null;
//     }
// }