import React, { useState, useEffect } from 'react'
import { API, graphqlOperation } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react'

// Queries
import { listNotes } from './graphql/queries'

// Mutations
import { createNote, deleteNote, updateNote } from './graphql/mutations'

// Suscriptions
import { onCreateNote, onDeleteNote, onUpdateNote } from './graphql/subscriptions'

/* Users:
Urhen123123
d1821039@urhen.com
*/

function App() {
  const [noteId, setNoteId] = useState('')
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState([{ id: 1, note: 'Hello world' }])

  useEffect(() => {
    getInitialNotes()

    const createNoteListener = API.graphql(graphqlOperation(onCreateNote)).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onCreateNote

        setNotes(prevNotes => {
          const newNotes = prevNotes.filter(note => note.id !== newNote.id)
          return [...newNotes, newNote]
        })
      },
    })

    const deleteNoteListener = API.graphql(graphqlOperation(onDeleteNote)).subscribe({
      next: noteData => {
        const deletedNote = noteData.value.data.onDeleteNote
        setNotes(prevNotes => prevNotes.filter(prevNote => prevNote.id !== deletedNote.id))
      },
    })

    const updateNoteListener = API.graphql(graphqlOperation(onUpdateNote)).subscribe({
      next: noteData => {
        const updatedNote = noteData.value.data.onUpdateNote
        setNotes(prevNotes => prevNotes.map(note => (note.id === updatedNote.id ? updatedNote : note)))
      },
    })

    return () => {
      createNoteListener.unsubscribe()
      deleteNoteListener.unsubscribe()
      updateNoteListener.unsubscribe()
    }
  }, [])

  async function getInitialNotes() {
    const notesData = await API.graphql(graphqlOperation(listNotes))
    console.log('TCL: getInitialNotes -> notesData', notesData)
    setNotes(notesData.data.listNotes.items)
  }

  const handleNewNoteChange = ({ target }) => setNewNote(target.value)

  const handleSubmit = async event => {
    event.preventDefault()

    const hasExistingNote = notes.find(({ id }) => id === noteId)
    if (hasExistingNote) return handleUpdateNote()

    const input = { note: newNote }
    await API.graphql(graphqlOperation(createNote, { input }))

    setNewNote('')
  }

  const handleSetNote = async ({ id, note }) => {
    setNoteId(id)
    setNewNote(note)
  }

  const handleUpdateNote = async () => {
    const input = { id: noteId, note: newNote }
    await API.graphql(graphqlOperation(updateNote, { input }))
  }

  const handleDeleteNote = async id => {
    const input = { id }
    await API.graphql(graphqlOperation(deleteNote, { input }))
  }

  return (
    <div className='flex flex-column items-center justify-center pa3 bg-washed-red'>
      <h1 className='code f2-l'>Amplify Notetaker</h1>

      <form className='mb3' onSubmit={handleSubmit}>
        <input
          type='text'
          placeholder='Write your note'
          className='pa2 f4'
          value={newNote}
          onChange={handleNewNoteChange}
        />
        <button type='submit' className='pa2 f4'>
          {noteId ? 'Update Note' : 'Add Note'}
        </button>
      </form>

      <div>
        {notes.map(item => (
          <div key={item.id} className='flex items-center'>
            <li onClick={() => handleSetNote(item)} className='list pa1 f3 pointer'>
              {item.note}
            </li>
            <button className='bg-transparent bn f4 pointer' onClick={() => handleDeleteNote(item.id)}>
              <span>&times;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default withAuthenticator(App, { includeGreetings: true })
