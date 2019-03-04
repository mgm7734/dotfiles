# When changing to a directing with  a PROJECT_SETTINGS file, source the file if given approval.
# Don't ask again for the same file as long as its checkusm is the same.
#
function cd() { builtin cd "$@" && source-project-settings; }
function pushd() { builtin pushd "$@" && source-project-settings; }
function popd() { builtin popd "$@" && source-project-settings; }
function source-project-settings() {
    file=`/bin/pwd`/PROJECT_SETTINGS
    if [ -e $file ] ; then
      whitelist=~/.proj-settings-whitelist
      touch $whitelist
      sum=`shasum $file`
      pat=" $file$"
      saved_sum=`grep "$pat" $whitelist`
      ok=true
      while [ x"$sum" != x"$saved_sum" -a $ok == 'true' ] ; do
        read -r -p "Whitelist $file for sourcing? [y/N/s/?]" answer
        case $answer in
          [yY])
            sed -i '' -e "\\|$pat|D" $whitelist
            echo "$sum" >> $whitelist
            saved_sum="$sum"
            ;;
          [sS])
            echo "Contents of $file:"
            cat $file
            ;;
          *)
            ok=false
        esac
      done
      if [ "$ok" == true ] ; then
        echo Evalutating $file
        . $file
      fi
    fi
}
