import React from 'react';
import {useTranslation} from "react-i18next";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
  useTheme
} from "@mui/material";
import {green, grey, yellow} from "@mui/material/colors";
import {Share} from "@mui/icons-material";
import {postData} from "./utils";


function fetchWord(resultFunc) {
  fetch("/api/wordle")
    .then(response => response.json())
    .then((result) => {
      if (result.status === 'success') {
        console.log(result);
        resultFunc(result);
      }
      else {
        console.log(result);
        resultFunc(null);
      }
    })
    .catch(err => {
      console.log(err);
      resultFunc(null);
    });
}

export default function Wordle(props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const NUM_ROWS = 6;
  const NUM_COLS = 6;

  const initialTiles = [];
  for (let i = 0; i < NUM_ROWS; i++) {
    const row = [];
    for (let j = 0; j < NUM_COLS; j++) {
      row.push({
        letter: null,
        status: 'empty', // empty, correct, wrong, misplaced
      });
    }
    initialTiles.push(row);
  }
  const [tiles, setTiles] = React.useState(initialTiles);
  const [curRow, setCurRow] = React.useState(0);
  const [curCol, setCurCol] = React.useState(0);
  const [correctLetters, setCorrectLetters] = React.useState(new Set());
  const [misplacedLetters, setMisplacedLetters] = React.useState(new Set());
  const [wrongLetters, setWrongLetters] = React.useState(new Set());
  const [hasWon, setHasWon] = React.useState(false);
  const [copyNotifOpen, setCopyNotifOpen] = React.useState(false);

  const [answerWord, setAnswerWord] = React.useState(null);
  const [todayNum, setTodayNum] = React.useState(null);

  React.useEffect(() => {
    const storedTiles = localStorage.getItem('wordle_tiles');
    const storedCorrectLetters = localStorage.getItem('wordle_correctLetters');
    const storedMisplacedLetters = localStorage.getItem('wordle_misplacedLetters');
    const storedWrongLetters = localStorage.getItem('wordle_wrongLetters');
    const storedCurRow = localStorage.getItem('wordle_curRow');
    const storedHasWon = localStorage.getItem('wordle_hasWon');
    const storedTodayNum = localStorage.getItem('wordle_todayNum');
    console.log("Checking localStorage for saved game state " + storedTodayNum + " " + todayNum);

    if (storedTodayNum !== null) {
      console.log(todayNum, JSON.parse(storedTodayNum), todayNum === JSON.parse(storedTodayNum));
      if (todayNum === JSON.parse(storedTodayNum)) {
        console.log("Using saved game state from localStorage");
        setTiles(JSON.parse(storedTiles));
        setCorrectLetters(new Set(JSON.parse(storedCorrectLetters)));
        setMisplacedLetters(new Set(JSON.parse(storedMisplacedLetters)));
        setWrongLetters(new Set(JSON.parse(storedWrongLetters)));
        setCurRow(JSON.parse(storedCurRow));
        setHasWon(JSON.parse(storedHasWon));
      }
    }

  }, [todayNum]);

  React.useEffect(() => {
    if (todayNum === null) {
      return; // No answer word or today number yet
    }
    console.log("Saving game state to localStorage");
    localStorage.setItem('wordle_tiles', JSON.stringify(tiles));
    localStorage.setItem('wordle_correctLetters', JSON.stringify(Array.from(correctLetters)));
    localStorage.setItem('wordle_misplacedLetters', JSON.stringify(Array.from(misplacedLetters)));
    localStorage.setItem('wordle_wrongLetters', JSON.stringify(Array.from(wrongLetters)));
    localStorage.setItem('wordle_curRow', JSON.stringify(curRow));
    localStorage.setItem('wordle_hasWon', JSON.stringify(hasWon));
    localStorage.setItem('wordle_todayNum', JSON.stringify(todayNum));
  }, [correctLetters, misplacedLetters, wrongLetters, curRow, hasWon]);

  const refresh = React.useCallback(
    () => {
      let active = true;

      fetchWord(
        (result) => {
          if (active) {
            setAnswerWord(result.word);
            setTodayNum(result.todayNum);
          }
        }
      );

      return () => {
        active = false;
      }
    },
    []
  );

  React.useEffect(() => {
    return refresh();
  }, [refresh]);

  const keyboardLayout = [
    ['ㅂ', 'ㅸ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅿ', 'ㅛ', 'ㅕ', 'ㅑ'],
    ['ㅁ', 'ㄴ', 'ㅇ', 'ㆁ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
    ['入', 'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㆍ', 'ㅡ', '←'],
  ];

  function tileColor(tile) {
    if (tile.status === 'correct') {
      return green['700'];
    }
    if (tile.status === 'misplaced') {
      return yellow['800'];
    }
    if (tile.status === 'wrong') {
      return grey['700'];
    }
    return theme.palette.background.default;
  }

  function borderWidth(tile) {
    if (tile.status === 'empty') {
      return '2px';
    }
    else {
      return 0;
    }
  }

  async function inputLetter(letter) {
    if (letter === '入') {
      // Check the answer
      if (curCol < NUM_COLS || curRow >= NUM_ROWS) {
        return; // Not enough letters filled
      }

      const newWord = tiles[curRow].map(tile => tile.letter).join('');
      // Check if the new word is in list
      const check = await postData("/api/wordle_check", { word: newWord })
        .then((result) => {
          if (result.status === 'success') {
            return result.included;
          }
          else {
            throw new Error(result.msg);
          }
        })
        .catch(err => {
          console.error(err);
          return false;
        });

      if (!check) {
        alert(t('입력한 단어가 목록에 없습니다. 다시 시도해주세요.'));
        return;
      }

      let isWrong = false;
      const newTiles = structuredClone(tiles);
      const answerLetters = answerWord.split('');
      for (let i = 0; i < NUM_COLS; i++) {
        const tile = newTiles[curRow][i];
        if (tile.letter === answerWord[i]) {
          tile.status = 'correct';
          correctLetters.add(tile.letter);
          answerLetters.splice(answerLetters.indexOf(tile.letter), 1);
        }
      }
      for (let i = 0; i < NUM_COLS; i++) {
        const tile = newTiles[curRow][i];
        if (tile.status === 'correct') {
          continue; // Already marked as correct
        }
        if (answerLetters.includes(tile.letter)) {
          tile.status = 'misplaced';
          misplacedLetters.add(tile.letter);
          answerLetters.splice(answerLetters.indexOf(tile.letter), 1);
          isWrong = true;
        } else {
          tile.status = 'wrong';
          wrongLetters.add(tile.letter);
          isWrong = true;
        }
      }
      setTiles(newTiles);
      setCurCol(0);
      setCurRow(curRow + 1);

      if (!isWrong) {
        setHasWon(true);
      }
    }
    else if (letter === '←') {
      const newTiles = structuredClone(tiles);
      if (curCol > 0) {
        newTiles[curRow][curCol - 1] = { letter: null, status: 'empty' };
        setCurCol(curCol - 1);
      }
      setTiles(newTiles);
    } else {
      if (curRow >= NUM_ROWS || curCol >= NUM_COLS) {
        return; // No more tiles to fill
      }

      const newTiles = structuredClone(tiles);
      newTiles[curRow][curCol] = { letter, status: 'empty' };
      setTiles(newTiles);

      // Move to the next tile
      setCurCol(curCol + 1);
    }
  }

  const handleGlobalKeyDown = React.useCallback(async (event) => {
    const code = (event.shiftKey? "Shift+" : "") + event.code;
    if (keyMap.hasOwnProperty(code)) {
      // prevent default action for the key
      event.preventDefault();
      const letter = keyMap[code];
      await inputLetter(letter);
    }
  }, [inputLetter]);

  React.useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);

    // Cleanup the event listener when the component unmounts
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]); // Empty dependency array ensures the effect runs only once

  async function shareResult() {
    let resultText = `마초아쎠 #${todayNum}: ${curRow}/${NUM_ROWS}\n`;
    for (let i = 0; i < curRow; i++) {
      for (let j = 0; j < NUM_COLS; j++) {
        const tile = tiles[i][j];
        if (tile.status === 'correct') {
          resultText += '🟩';
        } else if (tile.status === 'misplaced') {
          resultText += '🟨';
        } else if (tile.status === 'wrong') {
          resultText += '⬛';
        }
      }
      resultText += "\n";
    }
    resultText += "find.됬.xyz/word";

    await navigator.clipboard.writeText(resultText);
    setCopyNotifOpen(true);
  }

  function keyboardColor(key) {
    if (key === '入') {
      return [grey[100], grey[900]];
    }
    if (key === '←') {
      return [grey[100], grey[900]];
    }
    if (correctLetters.has(key)) {
      return [green[700], grey[50]];
    }
    if (misplacedLetters.has(key)) {
      return [yellow[800], grey[50]];
    }
    if (wrongLetters.has(key)) {
      return [grey[500], grey[50]];
    }
    return [grey[800], grey[50]];
  }

  if (todayNum === null) {
    return (
      <Stack spacing={3} sx={{textAlign: "center"}}>
        <Typography variant='h4' sx={{fontWeight: "bold"}}>
          {t('오늘의 마초아쎠를 불러오는 중...')}
        </Typography>
      </Stack>
    );
  }

  return (
    <React.Fragment>
      <Stack spacing={3} alignItems="center">
        <Typography variant='h4' sx={{textAlign: "center", fontWeight: "bold"}}>
          {t('오늘의 마초아쎠 #')}{todayNum}
        </Typography>
        <Grid container spacing={0} alignItems="center" justifyContent="center">
          <Grid item xs={12} sm={6} lg={5} container spacing={1} alignItems="center" justifyContent="center">
            {tiles.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {row.map((tile, colIndex) => (
                  <Grid item xs={12 / NUM_COLS} key={colIndex}>
                    <Paper style={{
                      display: "flex",
                      aspectRatio: "1 / 1",
                      backgroundColor: tileColor(tile),
                      borderWidth: borderWidth(tile),
                      borderColor: grey['500'],
                      borderStyle: 'solid',
                      justifyContent: "center",
                      alignItems: "center",
                    }}>
                      <Typography variant='h4' sx={{
                        fontWeight: "bold",
                        color: tile.status === 'empty' ? theme.palette.text.primary : grey[50],
                      }}>
                        {tile.letter}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </React.Fragment>
            ))}
          </Grid>
        </Grid>
        <Grid container spacing={0} alignItems="center" justifyContent="center">
          <Grid item xs={12} lg={6} container spacing={1} alignItems="center" justifyContent="center">
            {keyboardLayout.map((row, rowIndex) => (
              <Grid item xs={12} key={rowIndex} container spacing={1} justifyContent="center">
                {row.map((key, colIndex) => (
                  <Grid item xs={12/10} key={colIndex}>
                    <div style={{
                      display: "flex",
                      aspectRatio: "2 / 3",
                    }}>
                      <Button variant="contained" style={{
                        justifyContent: "center",
                        alignItems: "center",
                        flex: 1,
                        minWidth: 0,
                        padding: 0,
                        backgroundColor: keyboardColor(key)[0],
                        color: keyboardColor(key)[1],
                      }} onClick={async (e) => {await inputLetter(key)}}>
                        <Typography variant='h6' sx={{
                          fontWeight: "bold",
                        }}>
                          {key}
                        </Typography>
                      </Button>
                    </div>
                  </Grid>
                ))}
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Stack>
      <Dialog open={hasWon || curRow === NUM_ROWS}>
        <DialogTitle>
          {t('마초아쎠 #')}{todayNum}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', padding: 2 }}>
            <Typography variant="h5" gutterBottom>
              {hasWon? t('축하합니다! 단어를 맞추셨습니다.') : t('아쉽게도 단어를 맞추지 못하셨습니다.')}
            </Typography>
            <Typography variant="body1">
              {t('정답: ')} {answerWord}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" marginTop={2}>
              <Button color="primary" onClick={() => {
                setHasWon(false);
                setTiles(initialTiles);
                setCurRow(0);
                setCurCol(0);
                setCorrectLetters(new Set());
                setMisplacedLetters(new Set());
                setWrongLetters(new Set());
              }}>
                {t('다시 플레이하기')}
              </Button>
              <Button variant="contained" color="primary" onClick={() => {
                shareResult();
              }}>
                {t('공유하기')}
                <Share/>
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={copyNotifOpen}
        autoHideDuration={1000}
        onClose={() => {setCopyNotifOpen(false)}}
        message={t("결과가 클립보드에 복사되었습니다.")}
      />
    </React.Fragment>
  )
}

const keyMap = {
  'KeyQ': 'ㅂ',
  'KeyW': 'ㅈ',
  'KeyE': 'ㄷ',
  'KeyR': 'ㄱ',
  'KeyT': 'ㅅ',
  'KeyY': 'ㅛ',
  'KeyU': 'ㅕ',
  'KeyI': 'ㅑ',
  'KeyA': 'ㅁ',
  'KeyS': 'ㄴ',
  'KeyD': 'ㅇ',
  'KeyF': 'ㄹ',
  'KeyG': 'ㅎ',
  'KeyH': 'ㅗ',
  'KeyJ': 'ㅓ',
  'KeyK': 'ㅏ',
  'KeyL': 'ㅣ',
  'KeyZ': 'ㅋ',
  'KeyX': 'ㅌ',
  'KeyC': 'ㅊ',
  'KeyV': 'ㅍ',
  'KeyB': 'ㅠ',
  'KeyN': 'ㅜ',
  'KeyM': 'ㅡ',
  'Shift+KeyQ': 'ㅸ',
  'Shift+KeyT': 'ㅿ',
  'Shift+KeyA': 'ㅿ',
  'Shift+KeyD': 'ㆁ',
  'Shift+KeyK': 'ㆍ',
  'Enter': '入',
  'Backspace': '←',
};
