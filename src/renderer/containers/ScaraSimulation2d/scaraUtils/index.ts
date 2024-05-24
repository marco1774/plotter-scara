/* eslint-disable no-plusplus */
export function canvasConfig(canvasRef: { current: HTMLCanvasElement }) {
  const canvas = canvasRef.current as HTMLCanvasElement;
  canvas.height = window.innerHeight / 2;
  canvas.width = window.innerWidth / 2;
  canvas.style.backgroundColor = '#afafaf';
  const ctx = canvas.getContext('2d');

  return {
    ctx,
    canvas,
  };
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
) {
  if (ctx == null) return;

  ctx.clearRect(
    -canvas.width,
    -canvas.height,
    canvas.width * 2,
    canvas.height * 2,
  );
}

export function centerOriginAndFlipYAxis(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  OFFSET_CARTESIAN_PLANE_AXIS_Y: number,
  SCALA: number,
) {
  if (ctx == null) return;

  ctx.translate(
    canvas.width / 2,
    canvas.height / 2 + OFFSET_CARTESIAN_PLANE_AXIS_Y,
  ); // sposta origine da top/sx al centro
  ctx.scale(SCALA, -SCALA); // cambia orientamento asse y numeri positi verso alto
}

export function drawCartesianPlane(ctx: CanvasRenderingContext2D) {
  if (ctx == null) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-400, 0);
  ctx.lineTo(400, 0);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 400);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

export function drawAndMoveFirstArm(
  ctx: CanvasRenderingContext2D,
  FIRST_ARM_X: number,
  FIRST_ARM_Y: number,
  OFFSET_ORIGIN_X: number,
  color: string,
) {
  if (ctx == null) return;

  ctx.beginPath(); // Partenza nuovo path
  ctx.moveTo(0 + OFFSET_ORIGIN_X, 0); // Origine Primo Braccio
  ctx.lineTo(FIRST_ARM_X, FIRST_ARM_Y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';
  ctx.stroke(); // Render del path
  ctx.closePath();
}

export function drawAndMoveSecondArm(
  ctx: CanvasRenderingContext2D,
  angle1: number,
  angle2: number,
  firstArmEndX: number,
  firstArmEndY: number,
  SECOND_ARM_LENGTH: number,
): { secondArmEndX: number; secondArmEndY: number } {
  if (ctx == null) return { secondArmEndX: 0, secondArmEndY: 0 };

  // Disegna il secondo braccio (elbow)
  ctx.beginPath();
  ctx.moveTo(firstArmEndX, firstArmEndY);
  const secondArmEndX =
    firstArmEndX + Math.sin(angle1 + angle2) * SECOND_ARM_LENGTH;
  const secondArmEndY =
    firstArmEndY + Math.cos(angle1 + angle2) * SECOND_ARM_LENGTH;
  ctx.lineTo(secondArmEndX, secondArmEndY);
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';
  ctx.stroke();
  return {
    secondArmEndX,
    secondArmEndY,
  };
}

export function drawGCodePath(
  ctx: CanvasRenderingContext2D,
  path: string | any[],

  DRAW_GCODE_PATH_LINE_WIDTH: number,
) {
  if (ctx == null) return;

  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.beginPath();
    ctx.lineWidth = DRAW_GCODE_PATH_LINE_WIDTH;
    ctx.strokeStyle = path[i].color;
    ctx.moveTo(path[i - 1].x, path[i - 1].y);
    ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
  }
}

function radiansToDegrees(radians: number) {
  const pi = Math.PI;
  // Conversione radianti in gradi
  return radians * (180 / pi);
}

export function XYToAngle(
  x: number,
  y: number,
  FIRST_ARM_LENGTH: number,
  SECOND_ARM_LENGTH: number,
) {
  const hypotenuse = Math.sqrt(x ** 2 + y ** 2);
  if (hypotenuse > FIRST_ARM_LENGTH + SECOND_ARM_LENGTH)
    throw new Error(
      'Cannot reach {hypotenuse}; total arm length is {FIRST_ARM_LENGTH + SECOND_ARM_LENGTH}',
    );
  const hypotenuseAngle = Math.asin(x / hypotenuse); // seno inverso in radianti di un numero
  const innerAngle = Math.acos(
    // coseno inverso in radianti di un numero
    (hypotenuse ** 2 + FIRST_ARM_LENGTH ** 2 - SECOND_ARM_LENGTH ** 2) /
      (2 * hypotenuse * FIRST_ARM_LENGTH),
  );
  const outerAngle = Math.acos(
    (FIRST_ARM_LENGTH ** 2 + SECOND_ARM_LENGTH ** 2 - hypotenuse ** 2) /
      (2 * FIRST_ARM_LENGTH * SECOND_ARM_LENGTH),
  );
  const shoulderMotorAngle = hypotenuseAngle - innerAngle;
  const elbowMotorAngle = Math.PI - outerAngle;

  return [
    radiansToDegrees(shoulderMotorAngle),
    radiansToDegrees(elbowMotorAngle),
  ];
}

export function effectorPoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: any,
  OFFSET_EFFECTOR_X: number,
) {
  if (ctx == null) return;

  ctx.beginPath();
  ctx.arc(x - OFFSET_EFFECTOR_X, y, 1, 0, 2 * Math.PI);
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.restore();
  ctx.closePath();
}
