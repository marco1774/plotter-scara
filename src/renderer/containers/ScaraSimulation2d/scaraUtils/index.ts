/* eslint-disable no-use-before-define */
import { PathTypes } from './scaraSimulation2d.types';

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
  if (ctx == null || canvas == null) return;

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

export function drawCartesianPlane(
  ctx: CanvasRenderingContext2D,
  GRID_POINTS_DISTANCE: number,
) {
  if (ctx == null) return;

  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = '#999';
  for (let pointX = -160; pointX < 170; pointX += GRID_POINTS_DISTANCE) {
    for (let pointY = 0; pointY < 160; pointY += GRID_POINTS_DISTANCE) {
      ctx.fillRect(pointX, pointY, 1, 1);
    }
  }
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
  LINE_WIDTH_ARM: number,
  color: string,
) {
  if (ctx == null) return;

  ctx.beginPath(); // Partenza nuovo path
  ctx.moveTo(0 + OFFSET_ORIGIN_X, 0); // Origine Primo Braccio
  ctx.lineTo(FIRST_ARM_X, FIRST_ARM_Y);
  ctx.strokeStyle = color;
  ctx.lineWidth = LINE_WIDTH_ARM;
  ctx.lineCap = 'round';
  ctx.stroke(); // Render del path
  ctx.closePath();
}

export function drawAndMoveSecondArm(
  ctx: CanvasRenderingContext2D,
  angShoulder: number,
  angElbow: number,
  firstArmEndX: number,
  firstArmEndY: number,
  SECOND_ARM_LENGTH: number,
  LINE_WIDTH_ARM: number,
): { secondArmEndX: number; secondArmEndY: number } {
  if (ctx == null) return { secondArmEndX: 0, secondArmEndY: 0 };

  // Disegna il secondo braccio (elbow)
  ctx.beginPath();
  ctx.moveTo(firstArmEndX, firstArmEndY);
  const secondArmEndX =
    firstArmEndX + Math.sin(angShoulder + angElbow) * SECOND_ARM_LENGTH;
  const secondArmEndY =
    firstArmEndY + Math.cos(angShoulder + angElbow) * SECOND_ARM_LENGTH;
  ctx.lineTo(secondArmEndX, secondArmEndY);
  ctx.strokeStyle = 'green';
  ctx.lineWidth = LINE_WIDTH_ARM;
  ctx.lineCap = 'round';
  ctx.stroke();
  return {
    secondArmEndX,
    secondArmEndY,
  };
}

export function drawGCodePath(
  ctx2: CanvasRenderingContext2D,
  path: PathTypes[],
  DRAW_GCODE_PATH_LINE_WIDTH: number,
) {
  if (ctx2 == null) return;
  // ctx2.moveTo(path[0].x, path[0].y);
  // for (let i = 1; i < path.length; i++) {
  ctx2.save();
  ctx2.beginPath();
  ctx2.lineWidth = DRAW_GCODE_PATH_LINE_WIDTH;
  ctx2.strokeStyle = path[path.length - 1].canDraw
    ? path[path.length - 1].color
    : 'rgb(47 202 20 / 0%)';
  ctx2.moveTo(path[path.length - 2].x, path[path.length - 2].y);
  ctx2.lineTo(path[path.length - 1].x, path[path.length - 1].y);
  ctx2.stroke();
  ctx2.restore();
  // }
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
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  ctx.closePath();
}

// export function maxWorkingArea(
//   ctx2: CanvasRenderingContext2D,
//   ctx: CanvasRenderingContext2D,
//   start,
//   TOTAL_ARMS_LENGTH: number,
//   OFFSET_EFFECTOR_X: number,
// ) {
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   // Disegna la semi circonferenza massima che il braccio può disegnare
//   for (let alpha = 1; alpha < 181; alpha++) {
//     start(
//       ctx2,
//       ctx,
//       Math.sin(-alpha * (Math.PI / 180)) * TOTAL_ARMS_LENGTH +
//         OFFSET_EFFECTOR_X,
//       Math.cos(-alpha * (Math.PI / 180)) * TOTAL_ARMS_LENGTH,
//       true,
//       'red',
//     );
//   }
//   for (let alpha = 180; alpha > 1; alpha--) {
//     start(
//       ctx2,
//       ctx,
//       Math.sin(alpha * (Math.PI / 180)) * TOTAL_ARMS_LENGTH + OFFSET_EFFECTOR_X,
//       Math.cos(alpha * (Math.PI / 180)) * TOTAL_ARMS_LENGTH,
//       true,
//       'blue',
//     );
//   }
//   // *************************************************************

//   // Disegna l'area massima rettangolare inscritta nel cerchio
//   start(
//     ctx2,
//     ctx,
//     Math.sin(-45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH + OFFSET_EFFECTOR_X,
//     1,
//   );
//   start(
//     ctx2,
//     ctx,
//     Math.sin(-45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH + OFFSET_EFFECTOR_X,
//     Math.cos(-45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH,
//     true,
//     'yellow',
//   );
//   start(
//     ctx2,
//     ctx,
//     Math.sin(45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH + OFFSET_EFFECTOR_X,
//     Math.cos(45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH,
//     true,
//     'yellow',
//   );
//   start(
//     ctx2,
//     ctx,
//     Math.sin(45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH + OFFSET_EFFECTOR_X,
//     0,
//     true,
//     'yellow',
//   );

//   start(
//     ctx2,
//     ctx,
//     Math.sin(-45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH + OFFSET_EFFECTOR_X,
//     0,
//     true,
//     'yellow',
//   );
//   // **************************************************************
// }
export function maxWorkingArea(
  ctx2,
  ctx,
  start,
  TOTAL_ARMS_LENGTH,
  OFFSET_EFFECTOR_X,
) {
  // Disegna la semi circonferenza massima che il braccio può disegnare
  let alpha = 1;
  const step = 1;

  function drawSemiCircle() {
    if (alpha < 181) {
      start(
        ctx2,
        ctx,
        Math.sin(-alpha * (Math.PI / 180)) * TOTAL_ARMS_LENGTH +
          OFFSET_EFFECTOR_X,
        Math.cos(-alpha * (Math.PI / 180)) * TOTAL_ARMS_LENGTH,
        true,
        'red',
      );
      alpha += step;
      setTimeout(drawSemiCircle, 10); // Aggiunge un ritardo di 10ms tra le chiamate
    } else {
      alpha = 180;
      drawReverseSemiCircle();
    }
  }

  function drawReverseSemiCircle() {
    if (alpha > 1) {
      start(
        ctx2,
        ctx,
        Math.sin(alpha * (Math.PI / 180)) * TOTAL_ARMS_LENGTH +
          OFFSET_EFFECTOR_X,
        Math.cos(alpha * (Math.PI / 180)) * TOTAL_ARMS_LENGTH,
        true,
        'blue',
      );
      alpha -= step;
      setTimeout(drawReverseSemiCircle, 10); // Aggiunge un ritardo di 10ms tra le chiamate
    } else {
      drawRectangle();
    }
  }

  function drawRectangle() {
    start(
      ctx2,
      ctx,
      Math.sin(-45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH + OFFSET_EFFECTOR_X,
      1,
      false,
      '',
    );
    setTimeout(() => {
      start(
        ctx2,
        ctx,
        Math.sin(-45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH + OFFSET_EFFECTOR_X,
        Math.cos(-45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH,
        true,
        'yellow',
      );
      setTimeout(() => {
        start(
          ctx2,
          ctx,
          Math.sin(45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH +
            OFFSET_EFFECTOR_X,
          Math.cos(45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH,
          true,
          'yellow',
        );
        setTimeout(() => {
          start(
            ctx2,
            ctx,
            Math.sin(45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH +
              OFFSET_EFFECTOR_X,
            0,
            true,
            'yellow',
          );
          setTimeout(() => {
            start(
              ctx2,
              ctx,
              Math.sin(-45 * (Math.PI / 180)) * TOTAL_ARMS_LENGTH +
                OFFSET_EFFECTOR_X,
              0,
              true,
              'yellow',
            );
          }, 10);
        }, 10);
      }, 10);
    }, 10);
  }

  drawSemiCircle();
}

export function inverseKinematicsSolver(
  x,
  y,
  FIRST_ARM_LENGTH,
  SECOND_ARM_LENGTH,
  OFFSET_EFFECTOR_X,
  OFFSET_ORIGIN_X,
) {
  const [tetha1, tetha2] = XYToAngle(
    x - OFFSET_EFFECTOR_X,
    y,
    FIRST_ARM_LENGTH,
    SECOND_ARM_LENGTH,
  );

  const angShoulder = tetha1 * (Math.PI / 180); // gradi in radianti
  const FIRST_ARM_X =
    Math.sin(angShoulder) * FIRST_ARM_LENGTH + OFFSET_ORIGIN_X;
  const FIRST_ARM_Y = Math.cos(angShoulder) * FIRST_ARM_LENGTH;
  const angElbow = tetha2 * (Math.PI / 180); // gradi in radianti

  return {
    FIRST_ARM_X,
    FIRST_ARM_Y,
    angElbow,
    angShoulder,
  };
}

export function evaluateAndDrawGcode(
  play,
  gcodeParsed,
  canvasRef,
  gcodeCount,
  start,
  ctx2,
  ctx,
  resetCanvasPath1,
  setIsPlaying,
) {
  let resetCanvasPath = resetCanvasPath1;
  if (play.current && gcodeCount.current < gcodeParsed.length) {
    if (resetCanvasPath) {
      clearCanvas(ctx, canvasRef.current as HTMLCanvasElement);
      resetCanvasPath = false;
    }
    if (typeof gcodeParsed[gcodeCount.current] === 'string') {
      gcodeCount.current++;
    } else {
      start(
        ctx2,
        ctx,
        gcodeParsed[gcodeCount.current][0],
        gcodeParsed[gcodeCount.current][1],
        gcodeParsed[gcodeCount.current][2],
        'red',
      );
      gcodeCount.current++;
    }
  } else if (gcodeCount.current === gcodeParsed.length && play.current) {
    gcodeCount.current = 0;
    play.current = false;
    resetCanvasPath = true;
    setIsPlaying(false);
  }
  return resetCanvasPath;
}
