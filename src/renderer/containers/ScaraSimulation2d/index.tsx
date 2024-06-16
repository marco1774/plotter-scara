/* eslint-disable react/button-has-type */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 *
 * ScaraSimulation2d
 *
 */
/*
1. **Ciclo `while` + `await new Promise((resolve) => setTimeout(resolve, 0))`**:
   - **Motivo**: Il ciclo `while` esegue iterazioni rapide e potrebbe bloccare il thread principale,
   impedendo a React di aggiornare lo stato e l'interfaccia utente.
   - **Soluzione**: Inserire una pausa asincrona tra le iterazioni con `await new Promise((resolve) => setTimeout(resolve, 0))`
   permette a React di processare gli aggiornamenti dello stato e rendere i cambiamenti, evitando un blocco continuo.

2. **`setInterval`**:
   - **Motivo**: Invece di eseguire tutte le iterazioni in rapida successione, `setInterval` esegue il codice a intervalli regolari,
   permettendo a React di aggiornare lo stato tra un'esecuzione e l'altra.
   - **Soluzione**: Utilizzare `setInterval` per aggiungere una nuova linea a `gCodeLine` a intervalli regolari (es. ogni 100 millisecondi),
   consente a React di mantenere l'interfaccia utente aggiornata senza blocchi.

- **Ciclo `while` + Pausa Asincrona**: Previene il blocco continuo del ciclo `while`, permettendo a React di aggiornare lo stato.
- **`setInterval`**: Esegue aggiornamenti a intervalli regolari, permettendo a React di mantenere l'interfaccia utente aggiornata senza blocchi.
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
  const canvasPathRef = React.useRef<HTMLCanvasElement>(null);
  const [play, setPlay] = React.useState<boolean>(false);
  const pause = React.useRef<boolean>(false);
  const [serialData, setSerialData] = React.useState('');

  const sendCommand = (command) => {
    window.electron.ipcRenderer.sendMessage('send-serial-command', command);
  };

  // Modifica la scala del canvas
  const SCALA = 1.4;
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
  const CANVAS_BG_COLOR = '#f4f4f400';
  // Spessore della linea di disegno del path
  const DRAW_GCODE_PATH_LINE_WIDTH = 0.6;
  // Canvas height
  const canvasHeight = TOTAL_ARMS_LENGTH * SCALA * 1.6;
  // Canvas width
  const canvasWidth = TOTAL_ARMS_LENGTH * SCALA * 2 + 10;
  // L'origine del piano cartesiano 0,0 è impostato al centro del canvas, aggiunge un offset in Y
  const OFFSET_CARTESIAN_PLANE_AXIS_Y =
    TOTAL_ARMS_LENGTH - TOTAL_ARMS_LENGTH * 0.5;
  // Distanza punti griglia piano cartesiano
  const GRID_POINTS_DISTANCE = 10;
  // L'origine dell'effector sarebbe 0,0 al centro dell'area di lavoro rettangolare in X,
  // questo aggiunge un offset per portalo all'estremo
  const OFFSET_EFFECTOR_X = TOTAL_ARMS_LENGTH * 0.707;
  // Spessore linea arm
  const LINE_WIDTH_ARM = 10;
  const gcodeCount = React.useRef<number>(0);
  const maxWorkingAreaPainted = React.useRef<boolean>(false);

  const path = React.useRef<PathTypes[]>([
    {
      x: 0,
      y: 0,
      color: 'transparent',
      canDraw: false,
    },
  ]);

  // const gcode = [
  //   [0, 20],
  //   [20, 20],
  //   [20, 0],
  //   [0, 0],
  // ];

  /*
  Prende il gcode caricato come stringa e lo espone in
  */
  const { gcodeContentString, setGcodeContentString } =
    useLoadGcodeContent(gcodeCount);

  // Prende la linea gcode per analizzarla
  const { gcodeParsed, setGcodeParsed } = useParseGcodeContent({
    gcodeContentString,
  });

  function handlePlay() {
    setPlay((prev) => !prev);
  }
  function handlePause() {
    pause.current = !pause.current;
  }

  React.useEffect(() => {
    // Resetta il contatore gcodeCount e il percorso
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // gcodeCount = 0;
    let requestAnimationId: number;
    path.current = [
      {
        x: 0,
        y: 0,
        color: 'transparent',
        canDraw: false,
      },
    ];

    // canvas config
    const canvas = canvasRef.current as HTMLCanvasElement;
    const canvasPath = canvasPathRef.current as HTMLCanvasElement;
    canvas.height = canvasHeight;
    canvas.width = canvasWidth;
    canvasPath.height = canvasHeight;
    canvasPath.width = canvasWidth;
    canvas.style.backgroundColor = CANVAS_BG_COLOR;
    canvasPath.style.backgroundColor = '#fff';
    const ctx = canvas.getContext('2d');
    const ctx2 = canvasPath.getContext('2d');
    if (canvas == null || ctx == null) return;
    if (canvasPath == null || ctx2 == null) return;
    /*
     * sposta le coordinate dell'origine al centro del canvas
     * inverte direzione asse Y
     */
    centerOriginAndFlipYAxis(ctx, canvas, OFFSET_CARTESIAN_PLANE_AXIS_Y, SCALA);
    centerOriginAndFlipYAxis(
      ctx2,
      canvas,
      OFFSET_CARTESIAN_PLANE_AXIS_Y,
      SCALA,
    );
    drawCartesianPlane(ctx, GRID_POINTS_DISTANCE);

    function start(
      ctx2: any,
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
      clearCanvas(ctx2, canvas);

      // Disegna il piano cartesiano
      drawCartesianPlane(ctx, GRID_POINTS_DISTANCE);

      // Disegna e muove il primo braccio
      drawAndMoveFirstArm(
        ctx2,
        FIRST_ARM_X,
        FIRST_ARM_Y,
        OFFSET_ORIGIN_X,
        LINE_WIDTH_ARM,
        'red',
      );

      // Disegna e muove il secondo braccio
      const { secondArmEndX, secondArmEndY } = drawAndMoveSecondArm(
        ctx2,
        angShoulder,
        angElbow,
        FIRST_ARM_X,
        FIRST_ARM_Y,
        SECOND_ARM_LENGTH,
        LINE_WIDTH_ARM,
      );

      // Aggiungi la posizione dell'effettore al percorso
      if (path.current.length === 1) {
        // siamo all'inizio
        path.current.push({
          x: secondArmEndX,
          y: secondArmEndY,
          color: gcodePathColor,
          canDraw,
        });
      } else {
        path.current.shift(); // rimuove primo elemento
        path.current.push({
          x: secondArmEndX,
          y: secondArmEndY,
          color: gcodePathColor,
          canDraw,
        });
      }

      // Disegna sul canvas
      drawGCodePath(ctx, path.current, DRAW_GCODE_PATH_LINE_WIDTH);

      // Sposta il punto effector
      effectorPoint(ctx2, x, y, OFFSET_EFFECTOR_X);
    }

    // Disegna la semi circonferenza massima che il braccio può disegnare
    // Disegna l'area massima rettangolare inscritta nel cerchio
    if (!maxWorkingAreaPainted.current) {
      maxWorkingAreaPainted.current = true;
      maxWorkingArea(ctx2, ctx, start, TOTAL_ARMS_LENGTH, OFFSET_EFFECTOR_X);
    }

    const animateCallback = (animate) => {
      if (!gcodeParsed.length || !play) return;
      if (ctx == null) return;

      if (!pause.current && gcodeCount.current < gcodeParsed.length) {
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
      } else {
        // gcodeCount = 0;
        // setPlay(false);
      }
      requestAnimationId = requestAnimationFrame(animate);
    };

    function animate() {
      animateCallback(animate);
    }

    animate();
    // eslint-disable-next-line react-hooks/exhaustive-deps, consistent-return
    return () => {
      // eslint-disable-next-line no-console
      console.log('pulizia');
      if (requestAnimationId) {
        cancelAnimationFrame(requestAnimationId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  return (
    <MainContainer>
      <header className={styles.box_header}>
        <h1>Simulazione 2D</h1>
      </header>
      <div className={styles.box_body}>
        <div id="TransformWrapperCont">
          <section className={styles.box_canvas}>
            <TransformWrapper panning={{ disabled: false }}>
              <TransformComponent>
                <canvas id="canvasPath" ref={canvasPathRef} />
                <canvas id="canvas" ref={canvasRef} />
              </TransformComponent>
            </TransformWrapper>
          </section>
          <section className={styles.gcode_list}>
            <GcodeList originalGcodeList={gcodeContentString} />
          </section>
        </div>
        <section className={styles.box_option}>
          <Button variant="contained" onclick={() => handlePlay()}>
            Play
          </Button>
          <Button variant="contained" onclick={() => handlePause()}>
            Pause
          </Button>
          <div>
            <h1>Arduino Serial Communication</h1>
            <Button variant="contained" onclick={() => sendCommand('accendi')}>
              Accendi
            </Button>
            <Button variant="contained" onclick={() => sendCommand('spegni')}>
              Spegni
            </Button>
            <Button
              variant="contained"
              onclick={() => sendCommand('accendi-verde')}
            >
              Accendi Verde
            </Button>
            <Button
              variant="contained"
              onclick={() => sendCommand('spegni-verde')}
            >
              Spegni Verde
            </Button>
            <Button
              variant="contained"
              onclick={() => sendCommand('accendi-blu')}
            >
              Accendi Blu
            </Button>
            <Button
              variant="contained"
              onclick={() => sendCommand('spegni-blu')}
            >
              Spegni Blu
            </Button>
            <div>
              <h2>Data from Arduino:</h2>
              <p>{serialData}</p>
            </div>
          </div>
          <SimulationOptions />
        </section>
      </div>
    </MainContainer>
  );
}
