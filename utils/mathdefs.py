"""
A line-by-line preprocessing filter of .quiz documents that provides a tool to
format math definitions in a way that reflows nicely on mobile.

It looks like:

  [defs]
    A = "the sum of the three dice rolls is 12",
    B = "the sum of the three dice rolls is odd".
  [/defs]
   
Always writes to standard out.
"""

import re

from dataclasses import dataclass
from sys import argv as args, exit, stderr, stdout

# sentinel value to indicate an iterator is exhausted
EXHAUSTED = object()

BEGIN_DEFS = re.compile(r"(\s*)\[defs\]\s*")
END_DEFS   = re.compile(r"\s*\[/defs\]\s*")
DEF_VAR    = re.compile(r"^\s*(\S+) = (.+)$")
DEF_PUNCT  = re.compile(r"(.+)([\.,]\s*)((?:\[.*\])?)")

@dataclass(frozen=True)
class VarDef:
	variable   : str
	definition : str

def output(line):
	# Use \n, even on Windows, hence write binary
	stdout.buffer.write(line.encode("utf-8"))

def format_def(definition):
	"""
	Applies a few simple, quality of life rules:
	  * Format begin/end quotes using LaTeX
	  * Format ending punctuation using LaTeX
	  * Coalesce adjacent inline math blocks
	"""
	
	if definition.count('"') == 2:
		definition = definition.replace('"', r'$\text{``}$', 1)
		definition = definition.replace('"', r"$\text{''}$", 1)
	
	if (match := DEF_PUNCT.fullmatch(definition)):
		prefix, punct, suffix = match.group(1), match.group(2), match.group(3)
		punct = punct.replace(".", "$.$").replace(",", "$,$")
		definition = prefix + punct + suffix
	
	while '$$' in definition:
		definition = definition.replace('$$', '')
	
	return definition

def output_defs(defs, prefix):
	def _output(s):
		output(f"{prefix}{s}\n")
	
	_output('<table style="margin: 1rem auto;">')
	_output('  <tbody>')
	
	for var_def in defs:
		_output( '    <tr>')
		_output(f'      <td style="vertical-align: top;">${var_def.variable} = $</td>')
		_output( '      <td>')
		_output(f'        {format_def(var_def.definition)}')
		_output( '      </td>')
		_output( '    </tr>')
	
	_output('  </tbody>')
	_output('</table>')

def preprocess_defs(lines, prefix):
	defs = []
	while (line := next(lines, EXHAUSTED)) is not EXHAUSTED:
		if END_DEFS.fullmatch(line):
			output_defs(defs, prefix)
			return
		elif (match := DEF_VAR.match(line)):
			defs.append(VarDef(variable=match.group(1), definition=match.group(2)))
		else:
			print("Syntax error: inside [defs], but not a valid definition", file=stderr)
			exit(-1)
	
	print("Syntax error: [defs] not closed by end of file.", file=stderr)
	exit(-1)

def preprocess(lines):
	while (line := next(lines, EXHAUSTED)) is not EXHAUSTED:
		if (match := BEGIN_DEFS.fullmatch(line)):
			preprocess_defs(lines, match.group(1))
		else:
			output(line)

def main():
	if len(args) < 2:
		print("Usage: mathutil <input.quiz>")
		exit(-1)
	
	with open(args[1], encoding="utf8") as f:
		lines = iter(f)
		preprocess(lines)

if __name__ == "__main__":
	main()