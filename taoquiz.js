#!/usr/bin/env node

import fs from "fs";
import path from "path";
import pug from "pug";
import url from "url";
import xml2js from "xml2js";

import { mathjax } from "mathjax-full/js/mathjax.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";
import { SVG } from "mathjax-full/js/output/svg.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function changeExtension(inPath, newExtension) {
	const basename = path.basename(inPath, path.extname(inPath))
	return path.join(path.dirname(inPath), basename + newExtension)
}

function stripCssComments(s) {
	const pattern = /\/\*.+?\*\/\n?\n?/gs;
	return s.replace(pattern, "");
}

async function parseQuiz(input) {
	// Quizzes are represented in XML; see sample-data/
	const parser = new xml2js.Parser({
		attrkey               : "attr"    ,
		trim                  : true      ,
		normalize             : true      ,
		explicitRoot          : false     ,
		explicitArray         : false     ,
		explicitChildren      : true      ,
		childkey              : "children",
		preserveChildrenOrder : true      , // important to preserve question ordering
	});
	
	return await parser.parseStringPromise(input);
}

function moveGlobalCache(doc) {
	/*
	 * Using MathJax's global font cache makes the page much smaller, but also
	 * Safari has trouble rendering it. To help it, manually move the cache to the top of
	 * the document, rather than the end.
	 */
	 const pattern = /<svg[^>]+id="MJX-SVG-global-cache">.+?<\/svg>/s;
	 
	 const fontCache = doc.match(pattern)[0];
	 doc = doc.replace(fontCache, "");
	 doc = doc.replace("<body>", "<body>" + fontCache);
	 
	 return doc;
}

function renderMath(doc) {
	console.log("Rendering math.");
	
	const adaptor = liteAdaptor();
	RegisterHTMLHandler(adaptor);
	
	const input     = new TeX({
		packages      : AllPackages,
		inlineMath    : [["$", "$"]  , ["\\(", "\\)"]],
		displayMath   : [["$$", "$$"], ["\\[", "\\]"]],
	});
	const output    = new SVG({
		fontCache     : "global",
	});
	const converter = mathjax.document(doc, {InputJax: input, OutputJax: output});
	
	converter.render();
	
	return moveGlobalCache(adaptor.doctype(converter.document) + "\n" + adaptor.outerHTML(adaptor.root(converter.document)));
}

function minPositive(...nums) {
	let result = -1;
	for (const num of nums) {
		if (num > 0 && (result == -1 || num < result)) {
			result = num;
		}
	}
	return result;
}

function autoSticky(question) {
	/*
	 * This fixes a problem on mobile browsers and other scenarios with a small device width.
	 * When you have inline math directly adjacent to (i.e. no spaces between) text, it's able to
	 * insert a line break between them, which looks bad.
	 *
	 * To fix this, wrap it in a span displayed as an inline block.
	 * Example:
	 *   [the $(m + 2)$-th Fibonacci number] becomes
	 *   [the <span class="sticky">$(m + 2)$-th</span> Fibonacci number]
	 *
	 * (see auto-sticky.md for more details)
	 */
	 
	let result = ""
	let index  = 0;
	let lastCp = 0;
	let begin$ = -1;
	let end$   = -1;
	let preSp  = -1;
	let postSp = -1;
	
	while ((begin$ = question.indexOf("$", index)) != -1) {
		// If it's escaped, and doesn't actually start math mode, continue
		if (question.charAt(begin$ - 1) === "\\") {
			index = begin$ + 1;
			continue;
		}
		
		// find the next _unescaped_ $
		end$ = begin$;
		while (end$ < question.length) {
			end$ = question.indexOf("$", end$ + 1);
			if (question.charAt(end$ - 1) !== "\\") break;
		}
		
		// Skip zero-length math blocks (typically actually the boundaries of display math)
		if (end$ === begin$ + 1) {
			index = end$ + 1;
			continue;
		}
		
		preSp  = Math.max(
			question.lastIndexOf(" " , begin$),
			question.lastIndexOf("\n", begin$),
			question.lastIndexOf("\t", begin$),
			question.lastIndexOf(">" , begin$)
		)
		postSp = minPositive(
			question.indexOf(" " , end$),
			question.indexOf("\n", end$),
			question.indexOf("\t", end$),
			question.indexOf("<" , end$)
		)
		
		// If there are spaces directly to either side of the math mode, there's nothing to do.
		if (preSp == begin$ - 1 && postSp == end$ + 1) {
			index = postSp + 1;
			result += question.substring(lastCp, index);
			lastCp = index;
			continue;
		}
		
		if (preSp == -1) {
			preSp = begin$;
		}
		if (postSp == -1) {
			postSp = question.length;
		}
		
		// Otherwise, insert the appropriate tag
		result += question.substring(lastCp, preSp + 1);
		result += '<span class="sticky">';
		result += question.substring(preSp + 1, postSp);
		result += "</span>";
		lastCp = postSp;
		index  = lastCp;
	}
	
	result += question.substring(lastCp);
	
	return result;
}

function processQuestions(quiz) {
	if (!!!quiz.attr.mathjax) return quiz;
	
	// hand each question's text over to processQuestion for transforming
	for (const question of quiz.children) {
		if (question?.attr?.raw) continue;
		
		if (question["#name"] === "multiple-choice") {
			question.question = autoSticky(question.question);
		} else if (question["#name"] === "short-answer") {
			question._ = autoSticky(question._);
		}
	}
	
	return quiz;
}

function renderQuiz(quiz) {
	// includes the style rules inline
	const styleRules = stripCssComments(fs.readFileSync(__dirname + "/taoquiz.css", "utf-8"));
	
	// render the quiz
	let result = pug.renderFile(__dirname + "/taoquiz.pug", {quiz, styleRules});
	
	// if needed, pre-render math using MathJax
	if (quiz.attr.mathjax) result = renderMath(result);
	
	return result;
}

async function readStdin() {
	const chunks = [];
	for await (const chunk of process.stdin) chunks.push(chunk);
	return Buffer.concat(chunks).toString("utf-8");
}

async function main(args) {
	if (args.length < 1) {
		console.log("Usage: taoquiz <file.quiz> [result.html]");
		process.exit(1);
	}
	
	const input  = args[0] === "-" ? await readStdin() : fs.readFileSync(args[0], "utf-8");
	const quiz   = processQuestions(await parseQuiz(input));
	const output = renderQuiz(quiz);
	
	const outPath = args.length > 1 ? args[1] : changeExtension(args[0], ".html");
	fs.writeFileSync(outPath, output, "utf-8");
	
	console.log(`Wrote quiz to ${outPath}.`);
}

await main(process.argv.slice(2));