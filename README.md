# SemAnn

Tool/interface for annotation of concordances :)
Developed within the <a href="https://www.arts.kuleuven.be/ling/qlvl/projects/current/nephological-semantics">Nephological Semantics project</a> of the QLVL Research group (KU Leuven).

## Features
- Upload your concordances
    - It must be a tab separated file with at least the columns 'id', 'left', 'target' and 'right'.
    - You name your type (group of tokens) and access it with the button in the sidebar. By default, the sets of values that a categorical variable can take depend on the name of the type, **but** if you have a column named 'lemma', that label will be used for grouping when showing the categorical variable. (Test with file "church.grouped.tsv")
    - Each different type you want to analyze must be a different file.
- Design your variables
    - Categorical variables, with a clear name (the name in your column, eventually), html labels for the annotation and the actual values that would show up in your dataframe.
    - Numerical variables, you just state the name.
    - Variables from file (categorical variables are stored in a file, and then you can load them again).
- Select different variables to annotate
    - Your custom variables
    - Confidence rating, for overall or categorical-variable-specific
    - Selection of relevant contextwords, for overall or categorical-variable-specific
    - Comments
- Set and reuse your settings, by clicking on the username (below the title)
    - Change your username.
    - Save your settings in a json file (the paths to your concordances and variables and your selection of variables).
    - Load old settings from the json file.
- Store and reload your progress
    - Save your progress as a json file.
    - Load your progress from the json file.
    - Export your annotations and concordances as a tsv file.

## Download
Installation files <a href="./Windows/">here</a>. You can test the app with the files (concordance: "church.tsv", variable: "church.json") in the "sample_files" directory.
