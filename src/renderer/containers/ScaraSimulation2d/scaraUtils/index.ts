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
  OFFSET_CARTESIAN_PLANE_AXIS_X: number,
  SCALA: number,
) {
  if (ctx == null) return;

  ctx.translate(
    canvas.width / 2 + OFFSET_CARTESIAN_PLANE_AXIS_X,
    canvas.height / 2 + OFFSET_CARTESIAN_PLANE_AXIS_Y,
  ); // sposta origine da top/sx al centro
  ctx.scale(SCALA, -SCALA); // cambia orientamento asse y numeri positi verso alto
}

export function drawCartesianPlane(
  ctx: CanvasRenderingContext2D,
  GRID_POINTS_DISTANCE: number,
  OFFSET_EFFECTOR_X: number,
  OFFSET_EFFECTOR_Y: number,
) {
  if (ctx == null) return;

  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = '#999';
  for (let pointX = -115; pointX < 105; pointX += GRID_POINTS_DISTANCE) {
    for (
      let pointY = 0 + OFFSET_EFFECTOR_Y;
      pointY < 175;
      pointY += GRID_POINTS_DISTANCE
    ) {
      ctx.fillRect(pointX, pointY, 1, 1);
    }
  }
  ctx.beginPath();
  ctx.moveTo(-400, 0 + OFFSET_EFFECTOR_Y);
  ctx.lineTo(400, 0 + OFFSET_EFFECTOR_Y);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0 - OFFSET_EFFECTOR_X, 0);
  ctx.lineTo(0 - OFFSET_EFFECTOR_X, 400);
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

export function XYToAngleArduino(
  x: number,
  y: number,
  FIRST_ARM_LENGTH: number,
  SECOND_ARM_LENGTH: number,
) {
  const hypotenuse = Math.sqrt(x ** 2 + y ** 2);
  console.log('Ipotenusa:', hypotenuse);

  if (hypotenuse > FIRST_ARM_LENGTH + SECOND_ARM_LENGTH)
    throw new Error(
      'Cannot reach {hypotenuse}; total arm length is {FIRST_ARM_LENGTH + SECOND_ARM_LENGTH}',
    );

  const hypotenuseAngle = Math.asin(x / hypotenuse); // seno inverso in radianti di un numero
  console.log('Angolo ipotenusa:', radiansToDegrees(hypotenuseAngle), 'gradi');

  const innerAngle = Math.acos(
    // coseno inverso in radianti di un numero
    (hypotenuse ** 2 + FIRST_ARM_LENGTH ** 2 - SECOND_ARM_LENGTH ** 2) /
      (2 * hypotenuse * FIRST_ARM_LENGTH),
  );
  console.log('innerAngle:', radiansToDegrees(innerAngle), 'gradi');

  const outerAngle = Math.acos(
    (FIRST_ARM_LENGTH ** 2 + SECOND_ARM_LENGTH ** 2 - hypotenuse ** 2) /
      (2 * FIRST_ARM_LENGTH * SECOND_ARM_LENGTH),
  );
  console.log('outerAngle:', radiansToDegrees(outerAngle), 'gradi');

  const shoulderMotorAngle = hypotenuseAngle - innerAngle;
  const elbowMotorAngle = Math.PI - outerAngle;
  console.log(
    'shoulderMotorAngle (gradi):',
    radiansToDegrees(shoulderMotorAngle),
  );
  console.log('elbowMotorAngle (gradi):', radiansToDegrees(elbowMotorAngle));

  const elbowMotorAngleCorrected = elbowMotorAngle + shoulderMotorAngle;
  return [
    radiansToDegrees(shoulderMotorAngle),
    radiansToDegrees(elbowMotorAngleCorrected),
  ];

  // return [
  //   radiansToDegrees(shoulderMotorAngle),
  //   radiansToDegrees(elbowMotorAngle),
  // ];
}

// function radiansToDegrees(radians) {
//   const pi = Math.PI;
//   return radians * (180 / pi); // Converte i radianti in gradi
// }

export function XYToAngle(x, y, FIRST_ARM_LENGTH, SECOND_ARM_LENGTH) {
  console.log('x, y:', x, y);
  const hypotenuse = Math.sqrt(x ** 2 + y ** 2); // Calcola la distanza dall'origine all'effettore
  console.log('Ipotenusa:', hypotenuse);

  if (hypotenuse > FIRST_ARM_LENGTH + SECOND_ARM_LENGTH) {
    throw new Error('Cannot reach target.'); // Se la posizione è fuori dalla portata, lancia un errore
  }

  // Calcola l'angolo dell'ipotenusa rispetto all'asse X utilizzando atan2, che gestisce tutti i quadranti
  const hypotenuseAngle = Math.atan2(y, x);
  console.log('Angolo ipotenusa:', radiansToDegrees(hypotenuseAngle), 'gradi');

  // Calcola l'angolo interno tra l'ipotenusa e il primo braccio
  const innerAngle = Math.acos(
    (hypotenuse ** 2 + FIRST_ARM_LENGTH ** 2 - SECOND_ARM_LENGTH ** 2) /
      (2 * hypotenuse * FIRST_ARM_LENGTH),
  );
  console.log('innerAngle:', radiansToDegrees(innerAngle), 'gradi');

  // Calcola l'angolo esterno tra i due bracci
  const outerAngle = Math.acos(
    (FIRST_ARM_LENGTH ** 2 + SECOND_ARM_LENGTH ** 2 - hypotenuse ** 2) /
      (2 * FIRST_ARM_LENGTH * SECOND_ARM_LENGTH),
  );
  console.log('outerAngle:', radiansToDegrees(outerAngle), 'gradi');

  // Calcola l'angolo della spalla e del gomito
  const shoulderMotorAngle = hypotenuseAngle - innerAngle;
  const elbowMotorAngle = Math.PI - outerAngle;

  console.log(
    'shoulderMotorAngle (gradi):',
    radiansToDegrees(shoulderMotorAngle),
  );
  console.log('elbowMotorAngle (gradi):', radiansToDegrees(elbowMotorAngle));

  // Converte gli angoli in gradi
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
  OFFSET_EFFECTOR_Y: number,
) {
  if (ctx == null) return;

  ctx.beginPath();
  ctx.arc(x - OFFSET_EFFECTOR_X, y + OFFSET_EFFECTOR_Y, 1, 0, 2 * Math.PI);
  ctx.strokeStyle = 'yellow';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  ctx.closePath();
}

/**
 * Risolve il problema dell'inversa cinematica per un braccio robotico SCARA.
 * Questa funzione calcola gli angoli dei bracci del braccio robotico basandosi sulle coordinate (x, y) del punto di effetto finale.
 *
 * @param x - Coordinata x del punto di effetto finale rispetto all'origine del braccio.
 * @param y - Coordinata y del punto di effetto finale rispetto all'origine del braccio.
 * @param FIRST_ARM_LENGTH - Lunghezza del primo braccio (segmento tra l'articolo 0 e l'articolo 1).
 * @param SECOND_ARM_LENGTH - Lunghezza del secondo braccio (segmento tra l'articolo 1 e il punto di effetto finale).
 * @param OFFSET_EFFECTOR_X - Offset x dell'effettore rispetto alla posizione calcolata.
 * @param OFFSET_ORIGIN_X - Offset x dell'origine del braccio rispetto all'origine globale.
 * @param OFFSET_EFFECTOR_Y - Offset y dell'effettore rispetto alla posizione calcolata.
 *
 * @returns Un oggetto contenente le coordinate (x, y) della posizione del primo articolo e gli angoli degli articoli in radianti.
 */
export function inverseKinematicsSolver(
  x,
  y,
  FIRST_ARM_LENGTH,
  SECOND_ARM_LENGTH,
  OFFSET_EFFECTOR_X,
  OFFSET_ORIGIN_X,
  OFFSET_EFFECTOR_Y,
) {
  // console.log('x,y:', x, y);
  const [tetha1, tetha2] = XYToAngle(
    x - OFFSET_EFFECTOR_X,
    y + OFFSET_EFFECTOR_Y,
    FIRST_ARM_LENGTH,
    SECOND_ARM_LENGTH,
  );
  // console.log('tetha1, tetha2:', tetha1, tetha2);

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
export function inverseKinematicsSolverArduino(
  x,
  y,
  FIRST_ARM_LENGTH,
  SECOND_ARM_LENGTH,
) {
  // Calcola gli angoli tramite la funzione XYToAngle
  const [tetha1, tetha2] = XYToAngleArduino(
    x,
    y,
    FIRST_ARM_LENGTH,
    SECOND_ARM_LENGTH,
  );
  console.log('tetha1-angShoulderGrad, tetha2-angElbowGrad:', tetha1, tetha2);

  const angShoulderGrad = tetha1; // Angolo della spalla in gradi
  const angElbowGrad = tetha2; // Angolo del gomito in gradi

  return {
    angShoulderGrad,
    angElbowGrad,
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
  manualPositionRefOffsetX,
  manualPositionRefOffsetY,
) {
  // Inizializza il flag per resettare il percorso del canvas
  let resetCanvasPath = resetCanvasPath1;

  // Se lo stato di gioco è attivo e non siamo all'ultimo comando G-Code
  if (play.current && gcodeCount.current < gcodeParsed.length) {
    // Se il flag di reset è impostato, pulisci il canvas e disattiva il flag di reset
    if (resetCanvasPath) {
      clearCanvas(ctx, canvasRef.current as HTMLCanvasElement);
      resetCanvasPath = false;
    }

    // Verifica se l'elemento corrente del G-Code è una stringa
    if (typeof gcodeParsed[gcodeCount.current] === 'string') {
      // Se è una stringa, incrementa il contatore dei comandi G-Code
      gcodeCount.current++;
    } else {
      // Altrimenti, esegui il comando G-Code:
      // - ctx2 e ctx sono i contesti del canvas
      // - La posizione X e Y vengono calcolate aggiungendo gli offset manualPositionRefOffsetX e manualPositionRefOffsetY
      // - Il terzo elemento del comando G-Code (gcodeParsed[gcodeCount.current][2]) viene passato come parametro booleano
      start(
        ctx2,
        ctx,
        gcodeParsed[gcodeCount.current][0] + manualPositionRefOffsetX,
        gcodeParsed[gcodeCount.current][1] + manualPositionRefOffsetY,
        gcodeParsed[gcodeCount.current][2],
        'red',
      );

      // Incrementa il contatore dei comandi G-Code
      gcodeCount.current++;
    }
  } else if (gcodeCount.current === gcodeParsed.length && play.current) {
    // Se siamo all'ultimo comando G-Code e lo stato di gioco è attivo
    // - Reimposta il contatore dei comandi G-Code a zero
    // - Disattiva lo stato di gioco
    // - Imposta il flag di reset per pulire il canvas alla prossima iterazione
    gcodeCount.current = 0;
    play.current = false;
    resetCanvasPath = true;
  }

  // Restituisci il flag di reset del percorso del canvas
  return resetCanvasPath;
}
