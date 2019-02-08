# Add `~/bin` to the `$PATH`
export PATH="$HOME/bin:$HOME/Google Drive/bin:$PATH";

export ANDROID_HOME=/Users/mgm/Library/Android/sdk

# Load the shell dotfiles, and then some:
# * ~/.path can be used to extend `$PATH`.
# * ~/.extra can be used for other settings you don’t want to commit.
for file in ~/.{path,exports,aliases,functions,extra}; do
	[ -r "$file" ] && [ -f "$file" ] && source "$file";
	[ -r "$file" ] && [ -f "$file" ] && echo  did "$file";
done;
source ~/bash-git-prompt/gitprompt.sh
unset file;

# Case-insensitive globbing (used in pathname expansion)
shopt -s nocaseglob;

# Append to the Bash history file, rather than overwriting it
shopt -s histappend;

# Autocorrect typos in path names when using `cd`
shopt -s cdspell;

# Enable some Bash 4 features when possible:
# * `autocd`, e.g. `**/qux` will enter `./foo/bar/baz/qux`
# * Recursive globbing, e.g. `echo **/*.txt`
for option in autocd globstar; do
	shopt -s "$option" 2> /dev/null;
done;

# Add tab completion for many Bash commands
if which brew > /dev/null && [ -f "$(brew --prefix)/share/bash-completion/bash_completion" ]; then
	source "$(brew --prefix)/share/bash-completion/bash_completion";
elif [ -f /etc/bash_completion ]; then
	source /etc/bash_completion;
fi;

# Enable tab completion for `g` by marking it as an alias for `git`
if type _git &> /dev/null && [ -f /usr/local/etc/bash_completion.d/git-completion.bash ]; then
	complete -o default -o nospace -F _git g;
fi;

# Add tab completion for SSH hostnames based on ~/.ssh/config, ignoring wildcards
[ -e "$HOME/.ssh/config" ] && complete -o "default" -o "nospace" -W "$(grep "^Host" ~/.ssh/config | grep -v "[?*]" | cut -d " " -f2- | tr ' ' '\n')" scp sftp ssh;

# Add tab completion for `defaults read|write NSGlobalDomain`
# You could just use `-g` instead, but I like being explicit
complete -W "NSGlobalDomain" defaults;

# Add `killall` tab completion for common apps
complete -o "nospace" -W "Contacts Calendar Dock Finder Mail Safari iTunes SystemUIServer Terminal Twitter" killall;

# error
error() {
    echo $1
    exit ${2-1}
}

################
# aws
export PATH="$PATH:~/Library/Python/2.7/bin"

# plantuml
plantuml() {
    ext=${1-uml}
    type=png

    while true; do
	for in in *.$ext; do
	    out=`basename $in .$ext`.$type
	    if [ $out -ot $in ] ; then
		java -jar ~/opt/plantuml/plantuml.jar -t$type $in
		echo -n "created $out "; date
		# command ""open -g ${basename $out}*.$type""
	fi
	done
	sleep 10
    done
}

####+pidfiles

# Use in script like this;
#
#     pf=$(pidfile_name)
#     pidfile_create $$ "$pf"
#     trap 'cleanup' INT TERM EXIT
#     # do stuff

#===  FUNCTION  ================================================================
#          NAME:  pidfile_name
#   DESCRIPTION:  create a predictable pid file name, put it in the right inode
#    PARAMETERS:  none
#       RETURNS:  path and filename
#===============================================================================
function pidfile_name() {
  myfile=$(basename "$0" .sh)
  whoiam=$(whoami)
  mypidfile=/tmp/$myfile.pid
  [[ "$whoiam" == 'root' ]] && mypidfile=/var/run/$myfile.pid
  echo $mypidfile
}


#===  FUNCTION  ================================================================
#          NAME:  pidfile_cleanup
#   DESCRIPTION:  post service processing (clean temp space,pid files)
#    PARAMETERS:  none
#       RETURNS:  none
#===============================================================================
function pidfile_cleanup () {
  #Don't recurse in the exit trap
  trap - INT TERM EXIT
  #remove the pid file cleanly on exit++
  [[ -f "$mypidfile" ]] && rm "$mypidfile"
  #add other post processing cleanup here
  exit
}


#===  FUNCTION  ================================================================
#          NAME:  isrunning
#   DESCRIPTION:  is any previous instance of this script already running
#    PARAMETERS:  pidfile location
#       RETURNS:  boolean 0|1
#===============================================================================
function isrunning() {
  pidfile="$1"
  [[ ! -f "$pidfile" ]] && return 1  #pid file is nonexistent
  procpid=$(<"$pidfile")
  [[ -z "$procpid" ]] && return 1  #pid file contains no pid
  # check process list for pid existence and is an instance of this script
  [[ ! $(ps -p $procpid | grep $(basename $0)) == "" ]] && value=0 || value=1
  return $value
}

#===  FUNCTION  ================================================================
#          NAME:  createpidfile
#   DESCRIPTION:  atomic creation of pid file with no race condition
#    PARAMETERS:  the pid to put in the file, the filename to use as a lock
#       RETURNS:  none
#===============================================================================
function pidfile_create() {
  mypid=$1
  pidfile=$2
  #Close stderr, don't overwrite existing file, shove my pid in the lock file.
  $(exec 2>&-; set -o noclobber; echo "$mypid" > "$pidfile")
  [[ ! -f "$pidfile" ]] && exit #Lock file creation failed
  procpid=$(<"$pidfile")
  [[ $mypid -ne $procpid ]] && {
    #I'm not the pid in the lock file
    # Is the process pid in the lockfile still running?
    isrunning "$pidfile" || {
      # No.  Kill the pidfile and relaunch ourselves properly.
      rm "$pidfile"
      $0 $@ &
    }
    exit
  }
}
####-pidfiles

if [ -e ~/.bash_local ]; then
    source ~/.bash_local
fi
if [ -f $(brew --prefix)/etc/bash_completion ]; then
  . $(brew --prefix)/etc/bash_completion
fi

#THIS MUST BE AT THE END OF THE FILE FOR SDKMAN TO WORK!!!
export SDKMAN_DIR="/Users/mgm/.sdkman"
[[ -s "/Users/mgm/.sdkman/bin/sdkman-init.sh" ]] && source "/Users/mgm/.sdkman/bin/sdkman-init.sh"
