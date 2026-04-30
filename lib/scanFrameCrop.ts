/**
 * Maps the on-screen scan guide (CardScanner overlay) onto photo pixel coordinates
 * using the same "cover" scaling the camera preview uses relative to the view.
 */

import * as ImageManipulator from 'expo-image-manipulator';

/** Must match CardScanner overlay layout */
export const SCAN_FRAME_TOP_PCT = 0.25;
export const SCAN_FRAME_HEIGHT_PX = 220;
export const SCAN_FRAME_HORIZONTAL_PX = 24;

export type ViewRect = { left: number; top: number; width: number; height: number };

export function guideFrameRectInView(viewWidth: number, viewHeight: number): ViewRect {
  const top = viewHeight * SCAN_FRAME_TOP_PCT;
  return {
    left: SCAN_FRAME_HORIZONTAL_PX,
    top,
    width: Math.max(0, viewWidth - 2 * SCAN_FRAME_HORIZONTAL_PX),
    height: SCAN_FRAME_HEIGHT_PX,
  };
}

/**
 * Visible region of the full image when the image is scaled with "cover" to fill the view.
 */
function coverVisibleImageRect(imageWidth: number, imageHeight: number, viewWidth: number, viewHeight: number) {
  const scale = Math.max(viewWidth / imageWidth, viewHeight / imageHeight);
  const visibleW = viewWidth / scale;
  const visibleH = viewHeight / scale;
  const offsetX = (imageWidth - visibleW) / 2;
  const offsetY = (imageHeight - visibleH) / 2;
  return { scale, visibleW, visibleH, offsetX, offsetY };
}

/**
 * Maps a rectangle in view coordinates to pixel crop in the source image (cover alignment).
 */
export function getGuideFrameCropRect(
  imageWidth: number,
  imageHeight: number,
  viewWidth: number,
  viewHeight: number,
  frameRect: ViewRect = guideFrameRectInView(viewWidth, viewHeight)
): { originX: number; originY: number; width: number; height: number } {
  const { visibleW, visibleH, offsetX, offsetY } = coverVisibleImageRect(
    imageWidth,
    imageHeight,
    viewWidth,
    viewHeight
  );

  let originX = offsetX + (frameRect.left / viewWidth) * visibleW;
  let originY = offsetY + (frameRect.top / viewHeight) * visibleH;
  let width = (frameRect.width / viewWidth) * visibleW;
  let height = (frameRect.height / viewHeight) * visibleH;

  originX = Math.floor(Math.max(0, originX));
  originY = Math.floor(Math.max(0, originY));
  width = Math.floor(Math.min(width, imageWidth - originX));
  height = Math.floor(Math.min(height, imageHeight - originY));

  if (width < 4 || height < 4) {
    return { originX: 0, originY: 0, width: imageWidth, height: imageHeight };
  }
  return { originX, originY, width, height };
}

export async function cropImageUriToGuideFrame(
  uri: string,
  imageWidth: number,
  imageHeight: number,
  viewWidth: number,
  viewHeight: number
): Promise<string> {
  const crop = getGuideFrameCropRect(imageWidth, imageHeight, viewWidth, viewHeight);
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ crop: { originX: crop.originX, originY: crop.originY, width: crop.width, height: crop.height } }],
    { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

export type BarcodeBoundsInput = {
  origin: { x: number; y: number };
  size: { width: number; height: number };
};

/**
 * Ratio of barcode area that lies inside the guide frame (0–1).
 */
export function barcodeGuideOverlapRatio(bounds: BarcodeBoundsInput, guide: ViewRect): number {
  const bLeft = bounds.origin.x;
  const bTop = bounds.origin.y;
  const bRight = bLeft + bounds.size.width;
  const bBottom = bTop + bounds.size.height;
  const gLeft = guide.left;
  const gTop = guide.top;
  const gRight = guide.left + guide.width;
  const gBottom = guide.top + guide.height;

  const xOverlap = Math.max(0, Math.min(bRight, gRight) - Math.max(bLeft, gLeft));
  const yOverlap = Math.max(0, Math.min(bBottom, gBottom) - Math.max(bTop, gTop));
  const overlapArea = xOverlap * yOverlap;
  const barcodeArea = bounds.size.width * bounds.size.height;
  if (barcodeArea <= 0) return 0;
  return overlapArea / barcodeArea;
}
