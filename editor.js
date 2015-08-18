$(function () {
  var $preview = $('#preview')
    , $editor = $('#editor')

  var TEMPLATE_ROW = $('#template-row').html()
    .replace(/\n/g, '')
    .replace(/\>[ ]+\</g, '><')
    .replace(/\>[ ]+\{\{/g, '>{{')
    .replace(/\}\}[ ]+\</g, '}}<')
    .trim()

  Mustache.parse(TEMPLATE_ROW)

  function render () {
    var content = $editor.val().trim()

    var maxLength = 0

    var rendered = content.split('\n').map(function (row, i) {
      maxLength = Math.max(maxLength, row.split('\\').length)
      return renderRow(row, i)
    }).join('')

    $preview.css('width', maxLength * 20).html(rendered)

    var width = Math.min(Math.max(maxLength * 20 + 80 + 200, 200), 600)

    $('#preview-container').css('width', width)
    $('#editor-container').css('right', width)
  }

  function renderRow (row, i) {
    var structure = {
      i: i,
      cols: [],
      text: ''
    }

    structure.cols = row.split('\\').map(function (col, j) {
      var divider = col.indexOf('~~')
      if (divider >= 0) {
        structure.text = col.substring(divider).trim()
        col = col.substring(0, divider)
      }

      var column = {
        j: j,
        raw: col,
        layers: []
      }

      col.split('!~').forEach(function (layer) {
        layer = layer.trim()
        if (layer) {
          var name = 'BSicon_' + (layer.replace(/ /, '_')) + '.svg'
            , hash = CryptoJS.MD5(name).toString(CryptoJS.enc.Hex)
          column.layers.push({
            a: hash.substring(0, 1),
            b: hash.substring(0, 2),
            name: encodeURIComponent(name)
          })
        }
      })

      return column
    })

    return Mustache.render(TEMPLATE_ROW, structure)
  }

  function syncFocus () {
    var selection = $editor.prop('selectionStart')

    var content = $editor.val()

    var rows = content.substring(0, selection).split('\n')
      , cols = rows.pop().split('\\')
      , cell = cols.pop()
      , text = cell + content.substring(selection).split('\n').shift()

    var row = rows.length
      , col = cols.length

    $preview.find('.focus').removeClass('focus')

    var divider = text.indexOf('~~')
      , heading = cell.length

    if ((divider == 0 && heading >= 1) || (divider > 0 && heading > divider)) {
      $preview.find('> div > .text[data-row="' + row + '"]').addClass('focus')
    } else {
      $preview.find('> div > .cell[data-row="' + row + '"][data-col="' + col + '"]').addClass('focus')
    }
  }

  $preview.on('click', '> div > .cell[data-row][data-col]', function () {
    var $this = $(this)

    var row = $this.data('row')
      , col = $this.data('col')

    var rows = $editor.val().split('\n').slice(0, row + 1)
      , cols = rows.pop().split('\\').slice(0, col + 1)

    var above = rows.join('\n').length
    above = rows.length ? above + 1 : 0

    var selection = cols.pop()

    var divider = selection.indexOf('~~')
    if (divider >= 0) {
      selection = selection.substring(0, divider)
    }

    var col = cols.join('\\').length
    col = cols.length ? col + 1 : 0

    var selectionStart = above + col
      , selectionEnd = selectionStart + selection.length

    $editor
      .prop('selectionStart', selectionStart)
      .prop('selectionEnd', selectionEnd)
      .focus()

    $preview.find('.focus').removeClass('focus')
    $this.addClass('focus')
  })

  $preview.on('click', '> div > .text[data-row]', function () {
    var $this = $(this)

    var row = $this.data('row')

    var rows = $editor.val().split('\n').slice(0, row + 1)
      , line = rows.pop()

    var above = rows.join('\n').length
    above = rows.length ? above + 1 : 0

    var divider = line.indexOf('~~')

    var selectionStart = above
      , selectionEnd = selectionStart + line.length

    if (divider > 0) {
      selectionStart += divider
    } else {
      selectionStart += line.length
    }

    $editor
      .prop('selectionStart', selectionStart)
      .prop('selectionEnd', selectionEnd)
      .focus()

    $preview.find('.focus').removeClass('focus')
    $this.addClass('focus')
  })

  $editor.on('keyup', $.debounce(250, function () {
    localStorage.setItem('content', $editor.val())
    render()
    syncFocus()
  }))

  $editor.on('mouseup', function () {
    syncFocus()
  })

  $editor.val(localStorage.getItem('content'))
  render()
})
