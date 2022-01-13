# The auto-sticky feature

(if you don't use the math features of Taoquiz, it's safe to completely ignore this document)

## Problem

While testing version 1 of Taoquiz on mobile, I noticed that browsers would sometimes insert inappropriate line breaks between inline math and surrounding text, like this:

![](https://media.discordapp.net/attachments/778547001461047296/931039120896163870/examples.png)

It's not a deal breaker, but I think it's quite ugly and distracts from the flow of the text. It's more of a problem on mobile, but desktop browsers are also affected.

## Analysis & Solution

- This happens when inline math is directly adjacent (i.e. not separated by any spaces) to the surrounding text or HTML.
- The user's expectation is that line breaks will not be inserted at these locations (under most circumstances, line breaks should only be inserted in whitespace or at [predefined points](https://github.com/paulmckrcu/perfbook/blob/master/ushyphex.tex)).
- After math is compiled by MathJax, it's just images from the perspective of the browser. The browser doesn't have the semantic information needed to discourage inappropriate line breaks. Hence, the problem.
- So I made Taoquiz give this information to the browser. The auto-sticky feature finds inline math directly adjacent to text and wraps the whole thing in a `<span class="sticky">`, which is set up to highly discourage but not prohibit line breaks within[^1].

## Example

```tex
You are given two bitstrings $a_1,a_2,...,a_n$ and $b_1,b_2,...,b_n$, both of length $n$.
```

is converted into

```html
You are given two bitstrings $a_1,a_2,...,a_n$ and <span class="sticky">$b_1,b_2,...,b_n$,</span> both of length <span class="sticky">$n$.</span>
```

Observe how not all inline math blocks are wrapped—only the ones adjacent to text.

## Implementation Notes

- Auto-sticky knows about `\$`, and doesn't consider it to be starting or ending inline math.
- It doesn't have any special handling for `$$`. It's odd to the extreme to encounter TeX that doesn't already have whitespace to either side of that token[^2], but it's something to be aware of.
- It explicitly **does not** support constructions of the form `$A = \text{``$a_i$ is odd''}$`—that is, math within `\text` within math. If this is a problem for you (which is fair), you can:
  - Use `\(` and `\)` to delimit the inner math; or
  - Mark the question (the `multiple-choice` or `short-answer`) as `raw="raw"`, which will disable non-MathJax processing of questions and answers[^3].
- Answers aren't currently processed, only questions.

## Philosophy

Taoquiz is built to apply just enough engineering/technology (and no more) to the content in order to let the meaning shine through without the student being distracted by presentation. This approach has many [advantages](README.md).

While this is the most complicated single algorithm in Taoquiz—it (and supporting code) is about 20% of the total <abbr title="Source Lines of Code">SLOC</abbr>—I think it's worth it because, in keeping with the content-first focus, it makes the content look better. I'd say it takes it from 90% to 100% on mobile and 100% to 102% on desktop.

The code is also very approachable; I wrote it with a relative novice (straight out of [2406](https://calendar.carleton.ca/undergrad/courses/COMP/#:~:text=COMP%202406), perhaps) in mind. Total SLOC of Taoquiz remains under 400 :slightly_smiling_face:.

[^1]: Technically, it tells the browser it should treat the entire sticky as a single unit when line breaking. The exact style rule is `display: inline-block;`.
[^2]: Indeed, I typically put `$$` on its own line.
[^3]: MathJax processing is of course disabled by not having `mathjax="mathjax"` on the quiz.

