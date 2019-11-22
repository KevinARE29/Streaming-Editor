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
  .help('h').argv;

const args = yargs._;
//console.log(yargs);

var commands = []; //This array saves all commands of multiples -f or -e options.
var file_path; //This variable saves the path of the file that contains the lines to be readed or updated.

//Validates if the extension of the backup file is valid
if (yargs.i) {
  validate_extension(yargs.i);
}

if (!(yargs.f || yargs.e)) {
  /* If the user especifies only a command and file without -e or -f option.
     The command and the file will be on the args variable. */
  commands.push(args[0]);
  file_path = args[1];
} else {
  if (yargs.f) {
    var commands_file_path; //This variable saves the path of the files that contains the commands.
    file_path = args[0];
    var file_commands; //This variable temporaly saves each command readed from the commands_file_path.
    if (typeof yargs.f === 'string') {
      commands_file_path = yargs.f;
      console.log(commands_file_path);
      validate_txt_extension(commands_file_path);
      file_commands = fs.readFileSync(commands_file_path, 'utf8').split('\r\n');
      commands = commands.concat(file_commands);
    } else {
      for (file of yargs.f) {
        commands_file_path = file;
        validate_txt_extension(commands_file_path);
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

//This sed implementation will only read txt files. Not png, jpg, docx or any other extension.
validate_txt_extension(file_path);

//Validates each command of the commands array variable.
validate_commands(commands);

//Executes all commands of the commands array variable on the file.
execute_commands(commands, file_path);

function validate_extension(ext) {
  //The extension of the backup file can't contains special characters.
  if (!/[a-zA-Z]$/.test(ext)) {
    console.log(`Extension not valid: ${ext}`);
    return process.exit();
  }
}

function validate_commands(commands) {
  for (command of commands) {
    if (!/^s\/[a-zA-Z. ]+\/[a-zA-Z. ]+\/[g|p]?$/.test(command)) {
      console.log(`Command not valid: ${command}`);
      return process.exit();
    }
  }
}

function validate_txt_extension(file_path) {
  try {
    if (path.extname(file_path) !== '.txt') {
      console.log(
        `File Extension not valid: ${file_path}. The File should have .txt extension`
      );
      return process.exit();
    }
  } catch (err) {
    console.log(`File path not found`);
  }
}

function execute_commands(commands, file_path) {
  fs.access(file_path, (err, data) => {
    if (err) {
      console.log(
        "The file doesn't exist or the user don't have permissions to read the file"
      );
      return;
    }
    fs.readFile(file_path, (err, data) => {
      if (err) {
        console.log('Error while reading the file');
        return;
      }
      const lines = data.toString().split('\n');
      var new_lines = [];
      for (line of lines) {
        for (command of commands) {
          var splitted_command = command.split('/');
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
            if (!yargs.n) {
              if (flag === 'p') {
                console.log(line);
              }
            } else {
              if (flag === 'p') {
                console.log(line);
              }
            }
          }
        } //end of "for commands" loop
        new_lines = new_lines.concat(line);
        if (!(yargs.n || yargs.i)) {
          console.log(line);
        }
      } // end of "for lines" loop
      if (yargs.i) {
        if (yargs.i !== true) {
          let backup_file_path = file_path + '.' + yargs.i;
          fs.copyFileSync(file_path, backup_file_path, err => {
            if (err) throw err;
          });
        }
        fs.writeFileSync(
          file_path,
          new_lines.join('\n'),
          { flag: 'w' },
          err => {
            if (err) throw err;
          }
        );
      }
    });
  });
}
