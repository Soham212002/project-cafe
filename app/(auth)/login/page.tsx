const handleLogin = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
        email, password
    })
    if (!error) router.push('/menu')
    else toast.error(error.message)
}

// On register, also create profile row
const handleRegister = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (data.user) {
        await supabase.from('profiles').insert({
            id: data.user.id,
            email,
            full_name: name,
            role: 'customer'
        })
    }
}