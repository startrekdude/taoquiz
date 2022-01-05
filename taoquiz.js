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

function renderQuiz(quiz) {
	// includes the style rules inline
	const styleRules = stripCssComments(fs.readFileSync(__dirname + "/taoquiz.css", "utf-8"));
	
	// render the quiz
	let result = pug.renderFile(__dirname + "/taoquiz.pug", {quiz, styleRules});
	
	// if needed, pre-render math using MathJax
	if (quiz.attr.mathjax) result = renderMath(result);
	
	return result;
}

async function main(args) {
	if (args.length < 1) {
		console.log("Usage: taoquiz <file.quiz> [result.html]");
		process.exit(1);
	}
	
	const input  = fs.readFileSync(args[0], "utf-8");
	const quiz   = await parseQuiz(input);
	const output = renderQuiz(quiz);
	
	const outPath = args.length > 1 ? args[1] : changeExtension(args[0], ".html");
	fs.writeFileSync(outPath, output, "utf-8");
	
	console.log(`Wrote quiz to ${outPath}.`);
}

await main(process.argv.slice(2));