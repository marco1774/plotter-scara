/* eslint-disable prettier/prettier */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-promise-executor-return */
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
  inverseKinematicsSolver,
  evaluateAndDrawGcode,
  inverseKinematicsSolverArduino,
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
import ManualPositionBtn from '../../components/ManualPositionBtn';

interface Props {}

export function ScaraSimulation2d(props: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const canvasPathRef = React.useRef<HTMLCanvasElement>(null);
  const play = React.useRef<boolean>(false); // booleano usato per far partire la simulazione del gcode, usando useRef si evita di re-renderizzare il componente , ricominciando da capo
  const pause = React.useRef<boolean>(false);
  const gcodeCount = React.useRef<number>(0);

  const manualPositionRef = React.useRef({ x: 0, y: 0 });

  const path = React.useRef<PathTypes[]>([
    {
      x: 0,
      y: 0,
      color: 'transparent',
      canDraw: false,
    },
  ]);
  // **************************** Modifica la scala del canvas ********************************
  const SCALA = 1;
  // Modifica la velocità dell'animazione
  const FPS = 60;
  // Il braccio è ancorato all'origine 0,0, questo aggiunge un offset in X
  const OFFSET_ORIGIN_X = 0;
  // Lunghezza primo braccio
  const FIRST_ARM_LENGTH = 110;
  // lungezza secondo braccio
  const SECOND_ARM_LENGTH = FIRST_ARM_LENGTH;
  const FOOTER_ROOM = 300;
  // Lunghezza totale dei due bracci
  const TOTAL_ARMS_LENGTH = FIRST_ARM_LENGTH - 1 + (SECOND_ARM_LENGTH - 1);
  // Colore di backgraund del canvas
  const CANVAS_BG_COLOR = '#f4f4f400';
  // Spessore della linea di disegno del path
  const DRAW_GCODE_PATH_LINE_WIDTH = 0.4;
  // Canvas height
  const canvasHeight = TOTAL_ARMS_LENGTH * SCALA * 1.6;
  // Canvas width
  const canvasWidth = TOTAL_ARMS_LENGTH * SCALA * 2 + 10;
  // L'origine del piano cartesiano 0,0 è impostato al centro del canvas, aggiunge un offset in Y
  const OFFSET_CARTESIAN_PLANE_AXIS_Y =
    TOTAL_ARMS_LENGTH - TOTAL_ARMS_LENGTH * 0.8;
  // L'origine del piano cartesiano 0,0 è impostato al centro del canvas, aggiunge un offset in X
  const OFFSET_CARTESIAN_PLANE_AXIS_X =
    TOTAL_ARMS_LENGTH - TOTAL_ARMS_LENGTH * 1.7;
  // Distanza punti griglia piano cartesiano
  const GRID_POINTS_DISTANCE = 10;
  // L'origine dell'effector sarebbe 0,0 al centro dell'area di lavoro rettangolare in X,
  // questo aggiunge un offset per portalo all'estremo
  const OFFSET_EFFECTOR_X = TOTAL_ARMS_LENGTH * 0.707 - 40;
  // questo aggiunge un offset per avere un margine in y
  const OFFSET_EFFECTOR_Y = 20;
  // Spessore linea arm
  const LINE_WIDTH_ARM = 15;

  // ************************************************************

  // gestione led
  const sendCommand = (command) => {
    window.electron.ipcRenderer.sendMessage('send-serial-command', command);
  };

  const [commandToSendX, setCommandToSendX] = React.useState(0);
  const [commandToSendY, setCommandToSendY] = React.useState(0);
  const [commandToSendZ, setCommandToSendZ] = React.useState(0);
  const [angoloSpalla, setAngoloSpalla] = React.useState(0);
  const [angoloGomito, setAngoloGomito] = React.useState(0);

  // Gestione dati ricevuti da arduino
  React.useEffect(() => {
    const serialDataFromArduino = (parm: any) => {
      console.log('%cserialDataFromArduino ~ parm:', 'color:red', parm);
    };

    // Sottoscrizione all'evento IPC Renderer 'gcode:load'.
    const unsubscribe = window.electron.ipcRenderer.on(
      'serialData',
      serialDataFromArduino,
    );

    // Pulizia del listener quando il componente viene smontato.
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Nessuna dipendenza, l'effetto esegue solo una volta.

  // ************************************************************

  function sendCommandsWithDelay(commands) {
    const x0 = -110; // Nuova origine x
    const y0 = 50; // Nuova origine y

    let index = 0;

    const sendNextCommand = () => {
      if (index < commands.length) {
        const originalX = commands[index][0];
        const originalY = -commands[index][1];

        // Traslazione corretta delle coordinate
        const translatedX = originalX + x0; // Somma per compensare la traslazione
        const translatedY = originalY - y0; // Sottrazione per y

        console.log(
          `Comando originale: (${originalX}, ${originalY}), traslato: (${translatedX}, ${translatedY})`,
        );

        // Calcolo degli angoli con la cinematica inversa
        const { angShoulderGrad, angElbowGrad } =
          inverseKinematicsSolverArduino(
            translatedX,
            translatedY,
            FIRST_ARM_LENGTH,
            SECOND_ARM_LENGTH,
          );

        console.log(
          `Comando inviato ad Arduino: ${angShoulderGrad},${angElbowGrad},0`,
        );

        sendCommand(`${angShoulderGrad},${angElbowGrad},0`); // La tua funzione per inviare un comando

        index++;
        setTimeout(sendNextCommand, 0); // Pianifica il prossimo invio
      }
    };

    sendNextCommand(); // Inizia la sequenza
  }

  //----------------------------------------------------------------------
  //                               ++START++
  // Punto di ingresso del gcode caricato da file txt
  // Prende il gcode caricato come stringa e lo espone in gcodeContentString
  const { gcodeContentString } = useLoadGcodeContent(gcodeCount);
  //----------------------------------------------------------------------

  //----------------------------------------------------------------------
  //                            ++Secondo step++
  // Prende la linea gcode per analizzarla, si attiva una volta che il gcode
  // è caricato
  // dentro gcodeContentString ed espone il gcode pulito dentro gcodeParsed
  const { gcodeParsed } = useParseGcodeContent({
    gcodeContentString,
  });
  console.log('🚀 ~ ScaraSimulation2d ~ gcodeParsed:', gcodeParsed);
  //----------------------------------------------------------------------

  function handlePlay() {
    play.current = !play.current;
  }
  function handlePause() {
    pause.current = !pause.current;
  }

  // Controlla il movimento manuale dello scara in base alla posizione manuale passata
  function handleManualPosition(x, y) {
    manualPositionRef.current.x = x;
    manualPositionRef.current.y = y;
  }

  /*
   * Funzione di avvio del disegno o della simulazione.
   *
   * @param ctx2 - Contesto grafico 2D per il disegno aggiuntivo o secondario.
   * @param ctx - Contesto grafico 2D principale utilizzato per il rendering della simulazione.
   * @param x - Coordinata x iniziale del punto di partenza.
   * @param y - Coordinata y iniziale del punto di partenza.
   * @param canDraw - Flag booleano che indica se è consentito o meno effettuare il disegno (abilitazione/disabilitazione).
   * @param gcodePathColor - Colore utilizzato per visualizzare il percorso G-code nella simulazione.
   */

  function start(
    ctx2: any,
    ctx: any,
    x: number,
    y: number,
    canDraw: boolean,
    gcodePathColor: string,
  ) {
    // Risolve la cinematica inversa per calcolare gli angoli degli articoli del braccio meccanico.
    const { FIRST_ARM_X, FIRST_ARM_Y, angElbow, angShoulder } =
      inverseKinematicsSolver(
        x,
        y,
        FIRST_ARM_LENGTH,
        SECOND_ARM_LENGTH,
        OFFSET_EFFECTOR_X,
        OFFSET_ORIGIN_X,
        OFFSET_EFFECTOR_Y,
      );

    // Pulisce il canvas ad ogni frame - layer dei bracci
    clearCanvas(ctx2, canvasRef.current as HTMLCanvasElement);

    // Disegna il piano cartesiano.
    drawCartesianPlane(
      ctx,
      GRID_POINTS_DISTANCE,
      OFFSET_EFFECTOR_X,
      OFFSET_EFFECTOR_Y,
    );

    // Disegna e muove il primo braccio al posizionamento calcolato.
    drawAndMoveFirstArm(
      ctx2,
      FIRST_ARM_X,
      FIRST_ARM_Y,
      OFFSET_ORIGIN_X,
      LINE_WIDTH_ARM,
      'red',
    );

    // Disegna e muove il secondo braccio al posizionamento calcolato.
    const { secondArmEndX, secondArmEndY } = drawAndMoveSecondArm(
      ctx2,
      angShoulder,
      angElbow,
      FIRST_ARM_X,
      FIRST_ARM_Y,
      SECOND_ARM_LENGTH,
      LINE_WIDTH_ARM,
    );

    // Aggiunge la posizione dell'effettore al percorso.
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

    // Disegna sul canvas il percorso tracciato dall'effettore.
    drawGCodePath(ctx, path.current, DRAW_GCODE_PATH_LINE_WIDTH);

    // Sposta il punto dell'effettore alla nuova posizione (x, y).
    effectorPoint(ctx2, x, y, OFFSET_EFFECTOR_X, OFFSET_EFFECTOR_Y);
  }

  const initializeCanvas = (canvas, canvasPath) => {
    canvas.height = canvasHeight;
    canvas.width = canvasWidth;
    canvasPath.height = canvasHeight;
    canvasPath.width = canvasWidth;
    canvas.style.backgroundColor = CANVAS_BG_COLOR;
    canvasPath.style.backgroundColor = '#fff';
  };

  const setupCanvasContext = (ctx, ctx2) => {
    if (canvasRef.current == null) return;
    /*
     * sposta le coordinate dell'origine al centro del canvas
     * inverte direzione asse Y
     */
    centerOriginAndFlipYAxis(
      ctx,
      canvasRef.current,
      OFFSET_CARTESIAN_PLANE_AXIS_Y,
      OFFSET_CARTESIAN_PLANE_AXIS_X,
      SCALA,
    );
    centerOriginAndFlipYAxis(
      ctx2,
      canvasRef.current,
      OFFSET_CARTESIAN_PLANE_AXIS_Y,
      OFFSET_CARTESIAN_PLANE_AXIS_X,
      SCALA,
    );
    drawCartesianPlane(
      ctx,
      GRID_POINTS_DISTANCE,
      OFFSET_EFFECTOR_X,
      OFFSET_EFFECTOR_Y,
    );
  };

  React.useEffect(() => {
    let requestAnimationId: number;
    let resetCanvasPath = true;

    // *********** canvas config ******************
    // Crea il primo canvas - Layer uno
    const canvas = canvasRef.current as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    // Crea il secondo canvas - Layer due
    const canvasPath = canvasPathRef.current as HTMLCanvasElement;
    const ctx2 = canvasPath.getContext('2d');
    // ********************************************
    if (canvas == null || ctx == null) return;
    if (canvasPath == null || ctx2 == null) return;

    initializeCanvas(canvas, canvasPath); // Imposta le proprietà relative ai due canvas (canvas e canvasPath)
    setupCanvasContext(ctx, ctx2); // Imposta nuove coordinate e cambia direzione asse y

    function animate() {
      if (ctx == null) return;
      if (!play.current) {
        // Sposta il braccio manualmente senza il gcode
        start(
          ctx2,
          ctx,
          manualPositionRef.current.x,
          manualPositionRef.current.y,
          false,
          'red',
        );
      } else {
        // Disegna il gcode
        resetCanvasPath = evaluateAndDrawGcode(
          play,
          gcodeParsed,
          canvasRef,
          gcodeCount,
          start,
          ctx2,
          ctx,
          resetCanvasPath,
          manualPositionRef.current.x,
          manualPositionRef.current.y,
        );
      }

      requestAnimationId = requestAnimationFrame(animate);
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
  }, [gcodeParsed]);

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
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="contained" onclick={() => handlePlay()}>
              Play
            </Button>
            <div
              className={`${
                play.current && gcodeCount.current < gcodeParsed.length
                  ? styles.activity_draw_gcode_led_on
                  : styles.activity_draw_gcode_led_off
              }`}
            />
            <Button variant="contained" onclick={() => handlePause()}>
              Pause
            </Button>
          </div>

          <div>
            <h1>Arduino Serial Communication</h1>
            <Button
              variant="contained"
              onclick={() => sendCommandsWithDelay([[1, 1, 0]])}
            >
              Invia comando prova arduino azzeramento
            </Button>
            <Button variant="contained" onclick={() => sendCommand('0,140,1')}>
              porta a 20 20
            </Button>
            <Button
              variant="contained"
              onclick={() => sendCommandsWithDelay(gcodeParsed)}
            >
              Serie comandi
            </Button>
            <Button
              variant="contained"
              onclick={() => sendCommandsWithDelay([[10.0, 0.0, 0]])}
            >
              x=5
            </Button>
            <Button
              variant="contained"
              onclick={() => sendCommandsWithDelay([[-10.0, 0.0, 0]])}
            >
              x=-5
            </Button>
            <Button
              variant="contained"
              onclick={() => sendCommandsWithDelay([[0.0, 10.0, 0]])}
            >
              y=10
            </Button>
            <Button
              variant="contained"
              onclick={() => sendCommandsWithDelay([[0.0, -10.0, 0]])}
            >
              y=-10
            </Button>
            <input
              type="text"
              placeholder="set X"
              onChange={(e) => setCommandToSendX(+e.target.value)}
            />
            <input
              type="text"
              placeholder="set Y"
              onChange={(e) => setCommandToSendY(+e.target.value)}
            />
            <input
              type="text"
              placeholder="set Z"
              onChange={(e) => setCommandToSendZ(+e.target.value)}
            />
            <Button
              variant="contained"
              onclick={() =>
                sendCommandsWithDelay([
                  [commandToSendX, commandToSendY, commandToSendZ],
                ])
              }
            >
              Execute comando
            </Button>
            <input
              type="number"
              placeholder="angolo spalla"
              onChange={(e) => setAngoloSpalla(+e.target.value)}
            />
            <Button
              variant="contained"
              onclick={() => sendCommand(`${angoloSpalla},${angoloGomito},0`)}
            >
              angolo spalla
            </Button>
            <input
              type="nember"
              placeholder="angolo gomito"
              onChange={(e) => setAngoloGomito(+e.target.value)}
            />
            <Button
              variant="contained"
              onclick={() => sendCommand(`${angoloSpalla},${angoloGomito},0`)}
            >
              angolo gomito
            </Button>
          </div>
          <ManualPositionBtn
            handleManualPosition={handleManualPosition}
            manualPositionRef={manualPositionRef.current}
          />
          <SimulationOptions />
        </section>
      </div>
    </MainContainer>
  );
}
