[ -n "$PS1" ] && source ~/.bash_profile;

# java jenv, etc
export JENV_ROOT=/usr/local/var/jenv
#if which jenv > /dev/null; then eval "$(jenv init -)"; fi

#THIS MUST BE AT THE END OF THE FILE FOR SDKMAN TO WORK!!!
export SDKMAN_DIR="/Users/mgm/.sdkman"
[[ -s "/Users/mgm/.sdkman/bin/sdkman-init.sh" ]] && source "/Users/mgm/.sdkman/bin/sdkman-init.sh"
