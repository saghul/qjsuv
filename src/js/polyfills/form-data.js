/* eslint-disable */

/* formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */

/* global FormData self Blob File */
/* eslint-disable no-inner-declarations */

if (typeof Blob !== 'undefined' && (typeof FormData === 'undefined' || !FormData.prototype.keys)) {

  function ensureArgs (args, expected) {
    if (args.length < expected) {
      throw new TypeError(`${expected} argument required, but only ${args.length} present.`)
    }
  }

  /**
   * @param {string} name
   * @param {string | undefined} filename
   * @returns {[string, File|string]}
   */
  function normalizeArgs (name, value, filename) {
    if (value instanceof Blob) {
      filename = filename !== undefined
      ? String(filename + '')
      : typeof value.name === 'string'
      ? value.name
      : 'blob'

      if (value.name !== filename || Object.prototype.toString.call(value) === '[object Blob]') {
        value = new File([value], filename)
      }
      return [String(name), value]
    }
    return [String(name), String(value)]
  }

  // normalize line feeds for textarea
  // https://html.spec.whatwg.org/multipage/form-elements.html#textarea-line-break-normalisation-transformation
  function normalizeLinefeeds (value) {
    return value.replace(/\r?\n|\r/g, '\r\n')
  }

  /**
   * @template T
   * @param {ArrayLike<T>} arr
   * @param {{ (elm: T): void; }} cb
   */
  function each (arr, cb) {
    for (let i = 0; i < arr.length; i++) {
      cb(arr[i])
    }
  }

  const escape = str => str.replace(/\n/g, '%0A').replace(/\r/g, '%0D').replace(/"/g, '%22')

  /**
   * @implements {Iterable}
   */
  class FormDataPolyfill {
    /**
     * FormData class
     *
     * @param {HTMLFormElement=} form
     */
    constructor (form) {
      /** @type {[string, string|File][]} */
      this._data = []

      const self = this
      form && each(form.elements, (/** @type {HTMLInputElement} */ elm) => {
        if (
          !elm.name ||
          elm.disabled ||
          elm.type === 'submit' ||
          elm.type === 'button' ||
          elm.matches('form fieldset[disabled] *')
        ) return

        if (elm.type === 'file') {
          const files = elm.files && elm.files.length
            ? elm.files
            : [new File([], '', { type: 'application/octet-stream' })] // #78

          each(files, file => {
            self.append(elm.name, file)
          })
        } else if (elm.type === 'select-multiple' || elm.type === 'select-one') {
          each(elm.options, opt => {
            !opt.disabled && opt.selected && self.append(elm.name, opt.value)
          })
        } else if (elm.type === 'checkbox' || elm.type === 'radio') {
          if (elm.checked) self.append(elm.name, elm.value)
        } else {
          const value = elm.type === 'textarea' ? normalizeLinefeeds(elm.value) : elm.value
          self.append(elm.name, value)
        }
      })
    }

    /**
     * Append a field
     *
     * @param   {string}           name      field name
     * @param   {string|Blob|File} value     string / blob / file
     * @param   {string=}          filename  filename to use with blob
     * @return  {undefined}
     */
    append (name, value, filename) {
      ensureArgs(arguments, 2)
      this._data.push(normalizeArgs(name, value, filename))
    }

    /**
     * Delete all fields values given name
     *
     * @param   {string}  name  Field name
     * @return  {undefined}
     */
    delete (name) {
      ensureArgs(arguments, 1)
      const result = []
      name = String(name)

      each(this._data, entry => {
        entry[0] !== name && result.push(entry)
      })

      this._data = result
    }

    /**
     * Iterate over all fields as [name, value]
     *
     * @return {Iterator}
     */
    * entries () {
      for (var i = 0; i < this._data.length; i++) {
        yield this._data[i]
      }
    }

    /**
     * Iterate over all fields
     *
     * @param   {Function}  callback  Executed for each item with parameters (value, name, thisArg)
     * @param   {Object=}   thisArg   `this` context for callback function
     */
    forEach (callback, thisArg) {
      ensureArgs(arguments, 1)
      for (const [name, value] of this) {
        callback.call(thisArg, value, name, this)
      }
    }

    /**
     * Return first field value given name
     * or null if non existent
     *
     * @param   {string}  name      Field name
     * @return  {string|File|null}  value Fields value
     */
    get (name) {
      ensureArgs(arguments, 1)
      const entries = this._data
      name = String(name)
      for (let i = 0; i < entries.length; i++) {
        if (entries[i][0] === name) {
          return entries[i][1]
        }
      }
      return null
    }

    /**
     * Return all fields values given name
     *
     * @param   {string}  name  Fields name
     * @return  {Array}         [{String|File}]
     */
    getAll (name) {
      ensureArgs(arguments, 1)
      const result = []
      name = String(name)
      each(this._data, data => {
        data[0] === name && result.push(data[1])
      })

      return result
    }

    /**
     * Check for field name existence
     *
     * @param   {string}   name  Field name
     * @return  {boolean}
     */
    has (name) {
      ensureArgs(arguments, 1)
      name = String(name)
      for (let i = 0; i < this._data.length; i++) {
        if (this._data[i][0] === name) {
          return true
        }
      }
      return false
    }

    /**
     * Iterate over all fields name
     *
     * @return {Iterator}
     */
    * keys () {
      for (const [name] of this) {
        yield name
      }
    }

    /**
     * Overwrite all values given name
     *
     * @param   {string}    name      Filed name
     * @param   {string}    value     Field value
     * @param   {string=}   filename  Filename (optional)
     */
    set (name, value, filename) {
      ensureArgs(arguments, 2)
      name = String(name)
      /** @type {[string, string|File][]} */
      const result = []
      const args = normalizeArgs(name, value, filename)
      let replace = true

      // - replace the first occurrence with same name
      // - discards the remaining with same name
      // - while keeping the same order items where added
      each(this._data, data => {
        data[0] === name
          ? replace && (replace = !result.push(args))
          : result.push(data)
      })

      replace && result.push(args)

      this._data = result
    }

    /**
     * Iterate over all fields
     *
     * @return {Iterator}
     */
    * values () {
      for (const [, value] of this) {
        yield value
      }
    }

    /**
     * [_blob description]
     *
     * @return {Blob} [description]
     */
    ['_blob'] () {
        const boundary = '----formdata-polyfill-' + Math.random(),
          chunks = [],
          p = `--${boundary}\r\nContent-Disposition: form-data; name="`
        this.forEach((value, name) => typeof value == 'string'
          ? chunks.push(p + escape(normalizeLinefeeds(name)) + `"\r\n\r\n${normalizeLinefeeds(value)}\r\n`)
          : chunks.push(p + escape(normalizeLinefeeds(name)) + `"; filename="${escape(value.name)}"\r\nContent-Type: ${value.type||"application/octet-stream"}\r\n\r\n`, value, `\r\n`))
        chunks.push(`--${boundary}--`)
        return new Blob(chunks, {
          type: "multipart/form-data; boundary=" + boundary
        })
    }

    ['_asMultipartText'] () {
        const boundary = '----formdata-polyfill-' + Math.random(),
          chunks = [],
          p = `--${boundary}\r\nContent-Disposition: form-data; name="`
        this.forEach((value, name) => typeof value == 'string'
          ? chunks.push(p + escape(normalizeLinefeeds(name)) + `"\r\n\r\n${normalizeLinefeeds(value)}\r\n`)
          : chunks.push(p + escape(normalizeLinefeeds(name)) + `"; filename="${escape(value.name)}"\r\nContent-Type: ${value.type||"application/octet-stream"}\r\n\r\n`, value, `\r\n`))
        chunks.push(`--${boundary}--`)
        return [chunks.join(''), "multipart/form-data; boundary=" + boundary]
    }

    /**
     * The class itself is iterable
     * alias for formdata.entries()
     *
     * @return {Iterator}
     */
    [Symbol.iterator] () {
      return this.entries()
    }

    /**
     * Create the default string description.
     *
     * @return  {string} [object FormData]
     */
    toString () {
      return '[object FormData]'
    }

    /**
     * Create the default string description.
     * It is accessed internally by the Object.prototype.toString().
     */
    get [Symbol.toStringTag]() {
      return 'FormData';
    }
  }

  globalThis['FormData'] = FormDataPolyfill
}
