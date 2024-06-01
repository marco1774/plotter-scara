/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 *
 * ScaraSimulation2d
 *
 */
import * as React from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
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
  inverseKinematicsSolver,
} from './scaraUtils';
import { gcode } from './scaraUtils/gcodeProva';
import { MainContainer } from '../../components/MainContainer';

import styles from './styles.module.scss';
import { PathTypes } from './scaraUtils/scaraSimulation2d.types';
import GcodeList from '../../components/GcodeList';
import SimulationOptions from '../../components/SimulationOptions';
import { useLoadGcodeContent } from './hooks/useLoadGcodeContent';
import { useParseGcodeContent } from './hooks/useParseGcodeContent';
import { Button } from '../../components/Button';

interface Props {}

export function ScaraSimulation2d(props: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Modifica la scala del canvas
  const SCALA = 2;
  // Modifica la velocità dell'animazione
  const FPS = 60;
  // Il braccio è ancorato all'origine 0,0, questo aggiunge un offset in X
  const OFFSET_ORIGIN_X = 0;
  // Lunghezza primo braccio
  const FIRST_ARM_LENGTH = 100;
  // lungezza secondo braccio
  const SECOND_ARM_LENGTH = FIRST_ARM_LENGTH;
  const FOOTER_ROOM = 300;
  // Lunghezza totale dei due bracci
  const TOTAL_ARMS_LENGTH = FIRST_ARM_LENGTH - 1 + (SECOND_ARM_LENGTH - 1);
  // Colore di backgraund del canvas
  const CANVAS_BG_COLOR = '#f4f4f4';
  // Spessore della linea di disegno del path
  const DRAW_GCODE_PATH_LINE_WIDTH = 0.6;
  // Canvas height
  const canvasHeight = TOTAL_ARMS_LENGTH * SCALA * 1.6;
  // Canvas width
  const canvasWidth = TOTAL_ARMS_LENGTH * SCALA * 2 + 10;
  // L'origine del piano cartesiano 0,0 è impostato al centro del canvas, aggiunge un offset in Y
  const OFFSET_CARTESIAN_PLANE_AXIS_Y =
    TOTAL_ARMS_LENGTH - TOTAL_ARMS_LENGTH * 0.2;
  // Distanza punti griglia piano cartesiano
  const GRID_POINTS_DISTANCE = 10;
  // L'origine dell'effector sarebbe 0,0 al centro dell'area di lavoro rettangolare in X,
  // questo aggiunge un offset per portalo all'estremo
  const OFFSET_EFFECTOR_X = TOTAL_ARMS_LENGTH * 0.707;
  // Spessore linea arm
  const LINE_WIDTH_ARM = 10;

  // const gcode = [
  //   [0, 20],
  //   [20, 20],
  //   [20, 0],
  //   [0, 0],
  // ];

  // Riceve il Gcode caricato e lo espone come una stringa
  const { gcodeContent } = useLoadGcodeContent();

  // Prende il Gcode e lo trasforma per usarlo
  const { gcodeParsed } = useParseGcodeContent({ gcodeContent });

  React.useEffect(() => {
    // canvas config
    const canvas = canvasRef.current as HTMLCanvasElement;
    canvas.height = canvasHeight;
    canvas.width = canvasWidth;
    canvas.style.backgroundColor = CANVAS_BG_COLOR;
    const ctx = canvas.getContext('2d');
    if (canvas == null || ctx == null) return;
    const path = [] as PathTypes[];
    console.log('🚀 ~ React.useEffect ~ path:', path);
    /*
     * sposta le coordinate dell'origine al centro del canvas
     * inverte direzione asse Y
     */
    centerOriginAndFlipYAxis(ctx, canvas, OFFSET_CARTESIAN_PLANE_AXIS_Y, SCALA);

    function start(
      ctx: any,
      x: number,
      y: number,
      canDraw: boolean,
      gcodePathColor: string,
    ) {
      // inverse kinematics solver
      const { FIRST_ARM_X, FIRST_ARM_Y, angElbow, angShoulder } =
        inverseKinematicsSolver(
          x,
          y,
          FIRST_ARM_LENGTH,
          SECOND_ARM_LENGTH,
          OFFSET_EFFECTOR_X,
          OFFSET_ORIGIN_X,
        );

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
        LINE_WIDTH_ARM,
        'red',
      );

      // Disegna e muove il secondo braccio
      const { secondArmEndX, secondArmEndY } = drawAndMoveSecondArm(
        ctx,
        angShoulder,
        angElbow,
        FIRST_ARM_X,
        FIRST_ARM_Y,
        SECOND_ARM_LENGTH,
        LINE_WIDTH_ARM,
      );

      // Aggiungi la posizione dell'effettore al percorso
      path.push({
        x: secondArmEndX,
        y: secondArmEndY,
        color: gcodePathColor,
        canDraw,
      });

      // Disegna sul canvas
      drawGCodePath(ctx, path, DRAW_GCODE_PATH_LINE_WIDTH);

      // Sposta il punto effector
      effectorPoint(ctx, x, y, OFFSET_EFFECTOR_X);
    }

    // Disegna la semi circonferenza massima che il braccio può disegnare
    // Disegna l'area massima rettangolare inscritta nel cerchio
    maxWorkingArea(ctx, start, TOTAL_ARMS_LENGTH, OFFSET_EFFECTOR_X);

    let myTimeout: any;
    let gcodeCount: number = 0;

    const animateCallback = (animate) => {
      if (gcodeCount >= gcodeParsed.length) {
        // path = [];
        // gcodeCount = 0;
      } else {
        if (ctx == null) return;
        start(
          ctx,
          gcodeParsed[gcodeCount][0],
          gcodeParsed[gcodeCount][1],
          gcodeParsed[gcodeCount][2],
          'red',
        );
        gcodeCount++;
      }
      requestAnimationFrame(animate);
    };

    function animate() {
      // myTimeout = setTimeout(() => {
      animateCallback(animate);
      // }, 1000 / FPS);
    }

    animate();
    // eslint-disable-next-line react-hooks/exhaustive-deps, consistent-return
    return () => {
      // eslint-disable-next-line no-console
      console.log('pulizia');
      clearTimeout(myTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gcodeParsed]);

  return (
    <MainContainer>
      <header className={styles.box_header}>
        <h1>Simulazione 2D</h1>
      </header>
      <div className={styles.box_body}>
        <section className={styles.box_canvas}>
          <TransformWrapper>
            <TransformComponent>
              <canvas id="canvas" ref={canvasRef} />
            </TransformComponent>
          </TransformWrapper>
          <GcodeList originalGcodeList={gcodeContent} />
        </section>
        <section className={styles.box_option}>
          {/* <Button variant="contained" onclick={handleStart}>
            Start
          </Button>
          <Button variant="contained" onclick={handlePause}>
            Pause
          </Button>
          <Button variant="contained" onclick={handleResume}>
            Resume
          </Button>
          <Button variant="contained" onclick={handleStop}>
            Stop
          </Button>
          <Button variant="contained" onclick={handleStep}>
            Step by step
          </Button> */}
          <SimulationOptions />
        </section>
      </div>
    </MainContainer>
  );
}
