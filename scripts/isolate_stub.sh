#!/bin/bash
# High-Compatibility Isolate Stub for Judge0
# Hỗ trợ giới hạn thời gian (TLE) bằng lệnh timeout

ARGS="$@"

# 1. Xử lý Init
if [[ "$ARGS" == *"--init"* ]]; then
    BOX_ID=0
    if [[ "$ARGS" =~ "-b "([0-9]+) ]]; then BOX_ID="${BASH_REMATCH[1]}"; fi
    SANDBOX_ROOT="/tmp/isolate/$BOX_ID"
    mkdir -p "$SANDBOX_ROOT/box"
    echo "$SANDBOX_ROOT"
    exit 0
fi

# 2. Xử lý Cleanup
if [[ "$ARGS" == *"--cleanup"* ]]; then
    BOX_ID=0
    if [[ "$ARGS" =~ "-b "([0-9]+) ]]; then BOX_ID="${BASH_REMATCH[1]}"; fi
    rm -rf "/tmp/isolate/$BOX_ID"
    exit 0
fi

# 3. Xử lý Run
if [[ "$ARGS" =~ .*" -- ".* ]]; then
    CMD_TO_RUN="${ARGS#* -- }"
    
    BOX_ID=0
    if [[ "$ARGS" =~ "-b "([0-9]+) ]]; then BOX_ID="${BASH_REMATCH[1]}"; fi
    BOX_DIR="/tmp/isolate/$BOX_ID/box"
    
    METADATA_PATH=""
    if [[ "$ARGS" =~ "-M "([^ ]+) ]]; then METADATA_PATH="${BASH_REMATCH[1]}"; fi

    TIME_LIMIT=""
    if [[ "$ARGS" =~ "-t "([0-9.]+) ]]; then TIME_LIMIT="${BASH_REMATCH[1]}"; fi

    if [ -d "$BOX_DIR" ]; then
        cd "$BOX_DIR"
        
        # Chuẩn hoá CMD
        CMD_TO_RUN=$(echo "$CMD_TO_RUN" | sed "s|/var/local/lib/isolate/$BOX_ID/box/||g")
        CMD_TO_RUN=$(echo "$CMD_TO_RUN" | sed 's| /stdin.txt| stdin.txt|g')
        CMD_TO_RUN=$(echo "$CMD_TO_RUN" | sed 's| > /stdout.txt| > stdout.txt|g')
        CMD_TO_RUN=$(echo "$CMD_TO_RUN" | sed 's| 2> /stderr.txt| 2> stderr.txt|g')
        CMD_TO_RUN=$(echo "$CMD_TO_RUN" | sed 's| > /compile_output.txt| > compile_output.txt|g')
        
        # Thực thi với timeout nếu có giới hạn
        if [ -n "$TIME_LIMIT" ]; then
            # Linux timeout hỗ trợ số thực trực tiếp (vd: 2.0)
            eval "timeout $TIME_LIMIT $CMD_TO_RUN"
        else
            eval "$CMD_TO_RUN"
        fi
        EXIT_CODE=$?
        
        # Ghi Metadata
        if [ -n "$METADATA_PATH" ]; then
            mkdir -p "$(dirname "$METADATA_PATH")"
            if [ $EXIT_CODE -eq 124 ]; then
                echo "status:TO" > "$METADATA_PATH"
                echo "message:Time limit exceeded" >> "$METADATA_PATH"
                # Ghi đè exitcode 124 cho Judge0
                echo "exitcode:124" >> "$METADATA_PATH"
            else
                echo "status:OK" > "$METADATA_PATH"
                echo "exitcode:$EXIT_CODE" >> "$METADATA_PATH"
            fi
            echo "time:${TIME_LIMIT:-0.00}" >> "$METADATA_PATH"
            echo "max-rss:1024" >> "$METADATA_PATH"
        fi
    fi
else
    exit 0
fi
