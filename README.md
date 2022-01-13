# Taoquiz

### An opinionated tool to create beautiful, lightweight, static HTML/CSS practice quizzes

*"Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away." - Antoine de Saint-Exupéry*

Taoquiz is a tool that compiles quizzes expressed as `.quiz` files (see the `sample-quizzes/` directory) into beautiful, lightweight, interactive, fully static, and standalone `.html` files (with *absolutely no* client JavaScript!). Full support for MathJax is included; wrap TeX math expressions in `$` or `$$` as appropriate.

## Features

* Multiple choice and short answer question types.
* Full support for TeX math expressions in both questions and answers, using [MathJax](https://www.mathjax.org/).
* Students can see what they got right and wrong after submitting the quiz (even with short answer questions).
* Overall score is computed and shown after submitting.
* Clean design, created to be easy to read.
* Fully responsive: looks just as good on mobile as desktop.
* **Not suitable for quizzes for credit:** like anything else without a backend, the correct answers are stored client-side.

## Advantages

* **Easy to deploy:** quizzes compile down to a single `.html` file, with a dependency on Google Fonts and *nothing else*. You can stick it on any static site host of your choice and let them handle any scaling, while still giving students a great experience.
* **Loads super fast:** Chrome DevTools is telling me 130 ms for an "empty cache and hard reload" of `w19-final-using-short-answer` (which is an extremely complex and math-heavy exemplar). Content is presented *instantly*, with no discernible delay.
* **Compatible, *to the extreme*:** You can take the `.html` quiz file, stick it on a USB, and load it up in Internet Explorer 11 on an airgapped computer not updated since late 2014.......with JavaScript completely disabled....and it'll work just as well as on modern Chrome! Literally every feature will work exactly the same, though Open Sans won't be able to load so you'll be stuck with Arial.
* **Embeddable:** Since this doesn't rely on any client JavaScript, it's possible to embed quizzes in any environment where HTML is allowed (*without* losing interactivity). Could be nice for a LMS or something.
* **Easy to author/adapt quizzes:** Open one of the `sample-quizzes/` in a text editor of your choice; the format is quite nice.

## Usage

`npm install --global` the newest tarball from the releases section, then:

```sh
> taoquiz
Usage: taoquiz <file.quiz> [result.html]
```

See `sample-quizzes/` for examples of the input format, and consult [auto-sticky.md](auto-sticky.md) for some things to be aware of if you're a heavy user of math mode.

## License

[BSD 3-Clause License](https://choosealicense.com/licenses/bsd-3-clause/)

## Motivation

These days, it sometimes seems like a lot of the web dev community is playing a kind of [Buzzword bingo](https://en.wikipedia.org/wiki/Buzzword_bingo) (Docker, anyone? React?). I wanted to show that, by taking a content-first approach, limiting your scope, and going back to basics, you can get pretty far with just a little bit of simple & approachable code (doing it without *client* JS was just icing on the cake<sup>1</sup>). Did I succeed? You decide:

```
> cloc taoquiz*
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
CSS                              1             38             45            157
JavaScript                       1             39             24            153
Pug                              1              3              0             51
-------------------------------------------------------------------------------
SUM:                             3             80             69            361
-------------------------------------------------------------------------------
```

<sup>1</sup>: weird expression. Icing is the best part of an average cake.