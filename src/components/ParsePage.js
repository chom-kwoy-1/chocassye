import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import React from "react";

import { useTranslation } from "./TranslationProvider";
import { yale_to_hangul } from "./YaleToHangul";
import { postData } from "./client_utils.js";

function makeParseTreeDOM(parseTree) {
  if (typeof parseTree.children === "string") {
    return (
      <Paper style={{ padding: "10px" }}>{parseTree.canonical_form}</Paper>
    );
  }
  return (
    <Stack direction="column">
      <Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            justifyContent: "center",
            alignItems: "flex-end",
          }}
          divider={<Box sx={{ py: "10px" }}>+</Box>}
        >
          {parseTree.children.map((child, i) => {
            return (
              <React.Fragment key={i}>{makeParseTreeDOM(child)}</React.Fragment>
            );
          })}
        </Stack>
      </Box>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        style={{
          borderBottom: "1px solid grey",
          borderLeft: "1px solid grey",
          borderRight: "1px solid grey",
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
          minHeight: "5px",
        }}
      >
        {yale_to_hangul(parseTree.canonical_form ?? "")}
      </Box>
      <Box display="flex" justifyContent="center" alignItems="center">
        {parseTree.label}
      </Box>
    </Stack>
  );
}

function makeName(parseTree) {
  if (typeof parseTree.children === "string") {
    return parseTree.canonical_form;
  }
  let result = [];
  for (let child of parseTree.children) {
    result.push(makeName(child));
  }
  return result.join(" + ");
}

function ParsePage() {
  const { t } = useTranslation();

  const [currentQuery, setCurrentQuery] = React.useState("안녕하시겠어요");
  const [parseResults, setParseResults] = React.useState([]);
  const [selectedParseIndex, setSelectedParseIndex] = React.useState("");

  function refresh() {
    postData("/api/parse", {
      text: currentQuery,
    })
      .then((result) => {
        console.log(result);
        if (result.status === "success") {
          setParseResults(result.data);
          if (result.data.length > 0) {
            setSelectedParseIndex(0);
          } else {
            setSelectedParseIndex("");
          }
        } else {
          setParseResults([]);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  let parseTreeDOM = null;
  if (
    Number.isInteger(selectedParseIndex) &&
    parseResults.length > selectedParseIndex
  ) {
    const parseTree = parseResults[selectedParseIndex];
    console.log(parseTree);
    parseTreeDOM = makeParseTreeDOM(parseTree);
  }

  let pr_sum = 0;
  for (let parseTree of parseResults) {
    pr_sum += parseTree["prob"];
  }

  let filteredResults = parseResults.filter((parseTree) => {
    return parseTree["prob"] / pr_sum > 0.001;
  });

  return (
    <Grid
      container
      spacing={{ xs: 0.5, sm: 1 }}
      alignItems="center"
      direction="row"
    >
      <Grid item xs={9} sm={10} md={11}>
        <TextField
          id={"searchTermField"}
          variant="filled"
          value={currentQuery}
          onChange={(event) => setCurrentQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              refresh();
            }
          }}
          label={t("Word or phrase")}
          fullWidth
        />
      </Grid>
      <Grid item xs={3} sm={2} md={1}>
        <Button variant="contained" fullWidth onClick={() => refresh()}>
          {t("Parse")}
        </Button>
      </Grid>
      <Grid item xs={12} container>
        <Grid item xs={3}>
          <Tabs
            orientation="vertical"
            variant="scrollable"
            value={selectedParseIndex}
            onChange={(event, index) => setSelectedParseIndex(index)}
            sx={{ borderRight: 1, borderColor: "divider", height: 600 }}
          >
            {filteredResults.map((result, i) => {
              return (
                <Tab
                  key={i}
                  label={`${makeName(result)} (${((result["prob"] / pr_sum) * 100).toFixed(1)}%)`}
                />
              );
            })}
          </Tabs>
        </Grid>
        <Grid item xs={9}>
          <Card elevation={1} style={{ backgroundColor: "#FAFBFB" }}>
            <CardContent>
              <Box display="flex" justifyContent="center" alignItems="center">
                {parseTreeDOM}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default ParsePage;
