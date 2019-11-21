const path = require('path');
const fs = require('fs');
const yargs = require('yargs')
  .boolean('n')
  .describe('n', "Prevents a line from being printed unless specified by '-p'")
  .describe(
    'i',
    'Allows sed to perform the modification in place on the file specified.'
  )
  .nargs('e', 1)
  .describe(
    'e',
    'Accepts multiple substitution commands, with one command per -e appearance.'
  )
  .nargs('f', 1)
  .describe(
    'f',
    'Expects a file which consists of several lines containing one command each.'
  )
  .help('h')
  .alias('h', 'help').argv;

const args = yargs._;
console.log(yargs);
console.log(args);

var commands = [];
var file_path;

if (!(yargs.f || yargs.e)) {
  commands.push(args[0]);
  file_path = args[1];
} else {
  if (yargs.f) {
    var commands_file_path;
    file_path = args[0];
    var file_commands;
    if (typeof yargs.f === 'string') {
      commands_file_path = yargs.f;
      console.log(commands_file_path);
      validate_file_extension(commands_file_path);
      file_commands = fs.readFileSync(commands_file_path, 'utf8').split('\r\n');
      commands = commands.concat(file_commands);
    } else {
      for (file of yargs.f) {
        commands_file_path = file;
        validate_file_extension(commands_file_path);
        file_commands = fs
          .readFileSync(commands_file_path, 'utf8')
          .split('\r\n');
        commands = commands.concat(file_commands);
      }
    }
  }
  if (yargs.e) {
    file_path = args[0];
    commands = commands.concat(yargs.e);
  }
}
validate_file_extension(file_path);
console.log(`commands: ${commands}`);
validate_commands(commands);
execute_commands(commands, file_path);

function validate_commands(commands) {
  for (command of commands) {
    if (!/^s\/[a-zA-Z. ]+\/[a-zA-Z. ]+\/[g|p]?$/.test(command)) {
      console.log(`Command not valid: ${command}`);
      return process.exit();
    }
  }
}

function validate_file_extension(file_path) {
  if (path.extname(file_path) !== '.txt') {
    console.log(
      `File Extension not valid: ${file_path}. The File should have .txt extension`
    );
    return process.exit();
  }
}

function execute_commands(commands, file_path) {
  fs.access(file_path, (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    fs.readFile(file_path, (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      const lines = data.toString().split('\r\n');
      var replaced_lines = [];
      for (line of lines) {
        is_substituted_line = false;
        for (command of commands) {
          splitted_command = command.split('/');
          var old_string = splitted_command[1];
          var new_string = splitted_command[2];
          var flag = splitted_command[3];

          if (line.includes(old_string)) {
            if (flag === 'g') {
              var old_string_regx = new RegExp(old_string, 'g');
              line = line.replace(old_string_regx, new_string);
            } else {
              line = line.replace(old_string, new_string);
            }
            is_substituted_line = true;
          }
        } //end of "for commands" loop
        if (is_substituted_line){
          replaced_lines = replaced_lines.concat(line);
        }
        if (!yargs.n) {
          console.log(line);
          if ((flag === 'p') & is_substituted_line) {
            console.log(line);
          }
        } else {
          if ((flag === 'p') & is_substituted_line) {
            console.log(line);
          }
        }
      } // end of "for lines" loop
      if (yargs.i) {
        if (yargs.i !== true) {
          //Generates bak
          let backup_file_path = file_path + "." + yargs.i
          fs.copyFile(file_path, backup_file_path, (err) => {
            if (err) throw err;
            console.log('source.txt was copied to destination.txt');
          });
        }
        console.log(`Modificates file: ${file_path}`);
        fs.writeFile(file_path, replaced_lines.join("\n"), { flag: 'w' }, err => {
          console.log(err);
        });
      }
    });
  });
}
