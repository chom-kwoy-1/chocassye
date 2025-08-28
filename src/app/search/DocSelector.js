import { useTranslation } from "@/components/TranslationProvider";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";

import { docSuggest } from "./search";

export default function DocSelector(props) {
  const { t } = useTranslation();
  const router = useRouter();

  // Document suggestions
  let [docSuggestions, setDocSuggestions] = React.useState({
    loaded: false,
    result: [],
    num_results: 0,
  });
  const prevDocSuggestions = React.useRef(docSuggestions);
  React.useEffect(() => {
    prevDocSuggestions.current = docSuggestions;
  }, [docSuggestions]);

  const suggest_doc = React.useCallback((doc) => {
    let active = true;

    setDocSuggestions({
      ...prevDocSuggestions.current,
      loaded: false,
    });

    docSuggest(doc).then((result) => {
      if (active) {
        if (result.status === "success") {
          setDocSuggestions({
            result: result.results,
            num_results: result.total_rows,
            loaded: true,
          });
        } else {
          console.error("Error loading document suggestions:", result.msg);
          // TODO: error handling
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    // Retrieve document suggestions when doc changes
    return suggest_doc(props.doc);
  }, [props.doc, suggest_doc]);

  const [open, setOpen] = React.useState(false);

  function handleChange(ev, doc, reason) {
    if (reason === "selectOption") {
      router.push(`/source?name=${doc.name}`);
    }
  }

  function handleKeyDown(ev) {
    if (ev.key === "Enter") {
      props.onRefresh();
    }
  }

  function handleDocChange(ev, value, reason) {
    if (reason === "input") {
      props.handleDocChange(value);
    }
  }

  let docCandLoading = !docSuggestions.loaded;

  return (
    <Autocomplete
      fullWidth
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={docSuggestions.result}
      getOptionLabel={(doc) =>
        typeof doc === "string" ? doc : `${doc.name} (${doc.year_string})`
      }
      loading={docCandLoading}
      freeSolo
      onChange={(ev, value, reason) => handleChange(ev, value, reason)}
      onInputChange={(ev, value, reason) => handleDocChange(ev, value, reason)}
      onKeyDown={(ev) => handleKeyDown(ev)}
      filterOptions={(x) => x}
      inputValue={props.doc}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
          label={t("document name...")}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {docCandLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
}
