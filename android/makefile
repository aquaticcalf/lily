.ONESHELL:
.PHONY: dev

SESSION_NAME := waydroid

dev: start
	@echo "lily"
	IP=""
	while [ -z "$$IP" ]; do
		sleep 1
		IP=$$(waydroid status | grep "IP address:" | awk '{print $$3}')
	done
	waydroid show-full-ui >/dev/null 2>&1
	sleep 2
	kotlin run --module app -d $$IP:5555

start:
	@echo "starting waydroid in tmux session : $(SESSION_NAME)"
	@tmux new-session -d -s $(SESSION_NAME) "waydroid session start"
	@echo "started!"

stop:
	@echo "stopping waydroid"
	@waydroid session stop
	@echo "killing tmux session"
	@tmux kill-session -t $(SESSION_NAME) 2>/dev/null || true
	@echo "stopped!"
