BUILD_DIR=build
BUILDTYPE?=Release

all: build

build:
	@mkdir -p $(BUILD_DIR)
	cd $(BUILD_DIR); cmake ../ -DCMAKE_BUILD_TYPE=$(BUILDTYPE)
	$(MAKE) -C $(BUILD_DIR) -j8

install:
	@$(MAKE) -C $(BUILD_DIR) install

clean:
	@$(MAKE) -C $(BUILD_DIR) clean

distclean:
	@rm -rf $(BUILD_DIR)

format:
	clang-format -i src/*.{c,h}

test:
	./$(BUILD_DIR)/tjs tests/run.js tests/

test-advanced:
	cd tests/advanced && npm install
	./$(BUILD_DIR)/tjs tests/run.js tests/advanced/

.PHONY: all build install clean distclean format test test-advanced
