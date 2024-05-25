/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 *
 * ScaraSimulation2d
 *
 */
import * as React from 'react';
import {
  centerOriginAndFlipYAxis,
  drawCartesianPlane,
  drawAndMoveFirstArm,
  drawGCodePath,
  drawAndMoveSecondArm,
  XYToAngle,
  clearCanvas,
  effectorPoint,
  maxWorkingArea,
} from './scaraUtils';
import { gcode } from './scaraUtils/gcodeProva';
import { MainContainer } from '../../components/MainContainer';

interface Props {}

export function ScaraSimulation2d(props: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Modifica la scala del canvas
  const SCALA = 1;
  // Modifica la velocità dell'animazione
  const FPS = 10;
  // Il braccio è ancorato all'origine 0,0, questo aggiunge un offset in X
  const OFFSET_ORIGIN_X = 0;
  // L'origine dell'effector sarebbe 0,0 al centro dell'area di lavoro rettangolare in X,
  // questo aggiunge un offset per portalo all'estremo
  const OFFSET_EFFECTOR_X = 140; // da rendere dinamica
  // Lunghezza primo braccio
  const FIRST_ARM_LENGTH = 100;
  // lungezza secondo braccio
  const SECOND_ARM_LENGTH = 100;
  const FOOTER_ROOM = 300;
  // Lunghezza totale dei due bracci
  const TOTAL_ARMS_LENGTH = FIRST_ARM_LENGTH - 1 + (SECOND_ARM_LENGTH - 1);
  // Colore di backgraund del canvas
  const CANVAS_BG_COLOR = '#afafaf';
  // Spessore della linea di disegno del path
  const DRAW_GCODE_PATH_LINE_WIDTH = 1;
  // Canvas height
  const canvasHeight = window.innerHeight / 1.5;
  // Canvas width
  const canvasWidth = window.innerWidth / 1.5;
  // L'origine del piano cartesiano 0,0 è impostato al centro del canvas, aggiunge un offset in Y
  const OFFSET_CARTESIAN_PLANE_AXIS_Y = canvasHeight / 2;
  // Distanza punti griglia piano cartesiano
  const GRID_POINTS_DISTANCE = 20;

  // let gcode = [
  //   [0, 10],
  //   [10, 10],
  //   [10, 0],
  //   [0, 0],
  // ];

  React.useEffect(() => {
    // canvas config
    const canvas = canvasRef.current as HTMLCanvasElement;
    canvas.height = canvasHeight;
    canvas.width = canvasWidth;
    canvas.style.backgroundColor = CANVAS_BG_COLOR;
    const ctx = canvas.getContext('2d');
    if (canvas == null || ctx == null) return;
    let path = [] as { x: any; y: any; color: any }[];
    let gcodeCount = 0;

    /*
     * sposta le coordinate dell'origine al centro del canvas
     * inverte direzione asse Y
     */
    centerOriginAndFlipYAxis(ctx, canvas, OFFSET_CARTESIAN_PLANE_AXIS_Y, SCALA);

    function start(ctx, x, y, DRAW_GCODE_PATH_COLOR = 'purple') {
      // inverse kinematics solver
      const [tetha1, tetha2] = XYToAngle(
        x - OFFSET_EFFECTOR_X,
        y,
        FIRST_ARM_LENGTH,
        SECOND_ARM_LENGTH,
      );

      const ang = tetha1 * (Math.PI / 180); // gradi in radianti
      const FIRST_ARM_X = Math.sin(ang) * FIRST_ARM_LENGTH + OFFSET_ORIGIN_X;
      const FIRST_ARM_Y = Math.cos(ang) * FIRST_ARM_LENGTH;
      const ang1 = tetha2 * (Math.PI / 180);

      // Pulisce il canvas ad ogni frame
      clearCanvas(ctx, canvas);

      // Disegna il piano cartesiano
      drawCartesianPlane(ctx, GRID_POINTS_DISTANCE);

      // Disegna e muove il primo braccio
      drawAndMoveFirstArm(
        ctx,
        FIRST_ARM_X,
        FIRST_ARM_Y,
        OFFSET_ORIGIN_X,
        'red',
      );

      // Disegna e muove il secondo braccio
      const { secondArmEndX, secondArmEndY } = drawAndMoveSecondArm(
        ctx,
        ang,
        ang1,
        FIRST_ARM_X,
        FIRST_ARM_Y,
        SECOND_ARM_LENGTH,
      );

      // Aggiungi la posizione dell'effettore al percorso
      path.push({
        x: secondArmEndX,
        y: secondArmEndY,
        color: DRAW_GCODE_PATH_COLOR,
      });

      // Disegna sul canvas
      drawGCodePath(ctx, path, DRAW_GCODE_PATH_LINE_WIDTH);

      // Individua il punto effector
      effectorPoint(ctx, x, y, OFFSET_EFFECTOR_X);
    }

    // Disegna la semi circonferenza massima che il braccio può disegnare
    // Disegna l'area massima rettangolare inscritta nel cerchio
    maxWorkingArea(ctx, start, TOTAL_ARMS_LENGTH, OFFSET_EFFECTOR_X);
    let myTimeout: any;
    const animateCallback = (animate) => {
      if (gcodeCount >= gcode.length) {
        path = [];
      } else {
        if (ctx == null) return;
        start(ctx, gcode[gcodeCount][0], gcode[gcodeCount][1], 'cyan');
        gcodeCount++;
      }
      requestAnimationFrame(animate);
    };
    function animate() {
      myTimeout = setTimeout(() => {
        animateCallback(animate);
      }, 1000 / FPS);
    }

    animate();
    // eslint-disable-next-line react-hooks/exhaustive-deps, consistent-return
    return () => {
      // eslint-disable-next-line no-console
      console.log('pulizia');
      clearTimeout(myTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainContainer>
      <h1>simulation2d</h1>
      <canvas id="canvas" ref={canvasRef} />
    </MainContainer>
  );
}
