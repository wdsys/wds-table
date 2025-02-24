// @ts-nocheck
/**
 * 判断一个空间相对于物体的比例。
 * Params:
 * @sw: space width
 * @sh: space height
 * @ow: object width
 * @oh: object height
 *
 * Return value:
 * 1: fit (合适)
 * 2: wide (空间较宽)
 * 3: narrow (空间较窄)
 */
function getSpaceFitness(sw, sh, ow, oh) {
  const a = sw * oh;
  const b = ow * sh;

  if (a === b) {
    return 1;
  }

  if (a > b) {
    return 2;
  }

  // a < b
  return 3;
}

/**
 * 计算等比例缩放后的新宽度。
 */
function getResizedWidth(oldWidth, oldHeight, newHeight) {
  return Math.floor((oldWidth / oldHeight) * newHeight);
}

/**
 * 计算等比例缩放后的新高度。
 */
function getResizedHeight(oldWidth, oldHeight, newWidth) {
  return Math.floor((oldHeight / oldWidth) * newWidth);
}

function getBestObjectSizeAndPosition(space, object) {
  const {
    width, height, paddingX, paddingY,
  } = space;
  const realSpaceWidth = width - paddingX * 2;
  const realSpaceHeight = height - paddingY * 2;

  let objWidth; let objHeight; let objLeft; let
    objTop;

  const fitness = getSpaceFitness(
    realSpaceWidth,
    realSpaceHeight,
    object.width,
    object.height,
  );
  if (fitness === 1) {
    objWidth = realSpaceWidth;
    objHeight = realSpaceHeight;
    objLeft = paddingX;
    objTop = paddingY;
  } else if (fitness === 2) { // wide space
    objWidth = getResizedWidth(object.width, object.height, realSpaceHeight);
    objHeight = realSpaceHeight;
    objLeft = Math.floor((width - objWidth) * 0.5);
    objTop = paddingY;
  } else { // narrow space
    objWidth = realSpaceWidth;
    objHeight = getResizedHeight(object.width, object.height, realSpaceWidth);
    objLeft = paddingX;
    objTop = Math.floor((height - objHeight) * 0.5);
  }

  return {
    width: objWidth,
    height: objHeight,
    left: objLeft,
    top: objTop,
  };
}

export {
  getSpaceFitness,
  getResizedWidth,
  getResizedHeight,
  getBestObjectSizeAndPosition,
};
